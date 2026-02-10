import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClickLogService {
  constructor(private prisma: PrismaService) {}

  // 특정 정비사의 클릭 통계
  async getStats(mechanicId: number) {
    const logs = await this.prisma.clickLog.findMany({
      where: { mechanicId },
      orderBy: { clickedAt: 'desc' },
    });

    // 일별 통계 (KST 기준)
    const dailyStats = logs.reduce(
      (acc, log) => {
        // KST로 변환하여 날짜 추출
        const kstDate = new Date(log.clickedAt.getTime() + 9 * 60 * 60 * 1000);
        const date = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalClicks: logs.length,
      dailyStats,
      recentLogs: logs.slice(0, 10),
    };
  }
}
