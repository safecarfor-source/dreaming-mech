import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PRO 가입 후 14일 내 사업자등록증 미제출 유저 자동 탈퇴 서비스
 *
 * 조건:
 *   - businessStatus === 'NONE' (사업자 미제출)
 *   - createdAt < 현재 시각 - 14일
 *   - isProtected === false (보호 계정 제외)
 *
 * 실행: 매일 새벽 3시 (KST)
 * KST 03:00 = UTC 18:00 (전날)  →  cron: '0 18 * * *'
 */
@Injectable()
export class AutoCleanupService {
  private readonly logger = new Logger(AutoCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── 매일 새벽 3시 KST (UTC 18:00) 자동 실행 ──
  @Cron('0 18 * * *', { name: 'auto-cleanup-unverified-users', timeZone: 'Asia/Seoul' })
  async cleanupUnverifiedUsers(): Promise<void> {
    this.logger.log('[자동탈퇴] 미제출 유저 정리 작업 시작');

    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    try {
      // 삭제 대상 유저 조회 (isProtected 계정은 절대 제외)
      const targets = await this.prisma.user.findMany({
        where: {
          businessStatus: 'NONE',
          createdAt: { lt: cutoffDate },
          isProtected: false,
        },
        select: {
          id: true,
          kakaoId: true,
          nickname: true,
          createdAt: true,
        },
      });

      if (targets.length === 0) {
        this.logger.log('[자동탈퇴] 삭제 대상 없음');
        return;
      }

      this.logger.log(`[자동탈퇴] 삭제 대상 ${targets.length}명 발견`);

      let deletedCount = 0;
      let failedCount = 0;

      for (const user of targets) {
        try {
          // 연결된 Mechanic의 userId null 처리 (정비소 데이터 보존)
          await this.prisma.mechanic.updateMany({
            where: { userId: user.id },
            data: { userId: null },
          });

          // 연결된 ServiceInquiry 삭제 (외래키 제약)
          await this.prisma.serviceInquiry.deleteMany({
            where: { userId: user.id },
          });

          // User 삭제 (Post/Comment/PostLike는 onDelete:SetNull으로 자동 처리)
          await this.prisma.user.delete({ where: { id: user.id } });

          this.logger.log(
            `[자동탈퇴] 삭제 완료 — userId:${user.id} ` +
              `nickname:${user.nickname || '이름없음'} ` +
              `가입일:${user.createdAt.toISOString().slice(0, 10)}`,
          );
          deletedCount++;
        } catch (err) {
          this.logger.error(`[자동탈퇴] userId:${user.id} 삭제 실패 — ${(err as Error).message}`);
          failedCount++;
        }
      }

      this.logger.log(
        `[자동탈퇴] 완료 — 삭제 ${deletedCount}명 / 실패 ${failedCount}명`,
      );
    } catch (err) {
      this.logger.error(`[자동탈퇴] 작업 오류 — ${(err as Error).message}`);
    }
  }

  // ── 관리자용: 삭제 예정 유저 수 미리보기 (API에서 호출 가능) ──
  async getCleanupPreview(): Promise<{
    targetCount: number;
    cutoffDate: Date;
    targets: Array<{
      id: number;
      nickname: string | null;
      createdAt: Date;
      daysElapsed: number;
    }>;
  }> {
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const targets = await this.prisma.user.findMany({
      where: {
        businessStatus: 'NONE',
        createdAt: { lt: cutoffDate },
        isProtected: false,
      },
      select: {
        id: true,
        nickname: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();
    return {
      targetCount: targets.length,
      cutoffDate,
      targets: targets.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        createdAt: u.createdAt,
        daysElapsed: Math.floor((now - u.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
    };
  }
}
