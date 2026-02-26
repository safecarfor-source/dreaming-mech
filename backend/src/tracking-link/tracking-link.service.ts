import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTrackingLinkDto,
  UpdateTrackingLinkDto,
} from './dto/tracking-link.dto';

@Injectable()
export class TrackingLinkService {
  private readonly logger = new Logger(TrackingLinkService.name);

  constructor(private prisma: PrismaService) {}

  // 외부 의존성 없이 고유한 6자리 코드 생성 (헷갈리는 문자 제외)
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 고유 코드 생성 (충돌 시 재시도)
  private async generateUniqueCode(): Promise<string> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.generateCode();
      const existing = await this.prisma.trackingLink.findUnique({
        where: { code },
      });
      if (!existing) return code;
    }
    throw new BadRequestException('고유 코드 생성에 실패했습니다. 다시 시도해주세요.');
  }

  // 서비스 내부 봇 감지 (클릭 기록 시 사용)
  private isBot(userAgent: string): boolean {
    if (!userAgent) return false;
    const botPatterns =
      /bot|crawl|spider|slurp|facebook|twitter|whatsapp|telegram|preview|fetch|curl|wget|python|java|ruby|php|go-http/i;
    return botPatterns.test(userAgent);
  }

  async create(dto: CreateTrackingLinkDto) {
    const code = await this.generateUniqueCode();

    const link = await this.prisma.trackingLink.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        targetUrl: dto.targetUrl ?? '/',
      },
    });

    this.logger.log(`추적 링크 생성: code=${code}, name=${dto.name}`);
    return link;
  }

  async findAll() {
    const links = await this.prisma.trackingLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clicks: true,
            inquiries: true,
            customers: true,
          },
        },
      },
    });

    // 각 링크에 대해 유니크 클릭(IP 기준) 집계
    const stats = await Promise.all(
      links.map(async (link) => {
        const uniqueClickGroups = await this.prisma.linkClick.groupBy({
          by: ['ipAddress'],
          where: { trackingLinkId: link.id, isBot: false },
        });

        const totalClicks = link._count.clicks;
        const totalInquiries = link._count.inquiries;
        const totalCustomers = link._count.customers;
        const uniqueClicks = uniqueClickGroups.length;
        const conversionRate =
          uniqueClicks > 0
            ? (totalInquiries / uniqueClicks) * 100
            : 0;

        return {
          ...link,
          totalClicks,
          uniqueClicks,
          totalInquiries,
          totalSignups: totalCustomers,  // Customer 가입 수
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      }),
    );

    return stats;
  }

  async findOne(id: number) {
    const link = await this.prisma.trackingLink.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clicks: true,
            inquiries: true,
            customers: true,
          },
        },
        customers: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        inquiries: {
          select: {
            id: true,
            name: true,
            phone: true,
            regionSido: true,
            regionSigungu: true,
            serviceType: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!link) {
      throw new NotFoundException(`추적 링크 #${id}를 찾을 수 없습니다.`);
    }

    // 일별 클릭 추이 (최근 30일, 봇 제외)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyClicks = await this.prisma.$queryRaw<
      Array<{ date: Date; clicks: number }>
    >`
      SELECT
        DATE("clickedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(*)::int as clicks
      FROM "LinkClick"
      WHERE "trackingLinkId" = ${id}
        AND "clickedAt" >= ${thirtyDaysAgo}
        AND "isBot" = false
      GROUP BY DATE("clickedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
      ORDER BY date DESC
    `;

    // 유니크 클릭 수 (IP 기준)
    const uniqueClickGroups = await this.prisma.linkClick.groupBy({
      by: ['ipAddress'],
      where: { trackingLinkId: id, isBot: false },
    });

    const totalInquiries = link._count.inquiries;
    const uniqueClicks = uniqueClickGroups.length;
    const conversionRate =
      uniqueClicks > 0 ? (totalInquiries / uniqueClicks) * 100 : 0;

    return {
      ...link,
      uniqueClicks,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dailyClicks,
    };
  }

  async update(id: number, dto: UpdateTrackingLinkDto) {
    // 존재 여부 확인
    const existing = await this.prisma.trackingLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`추적 링크 #${id}를 찾을 수 없습니다.`);
    }

    const link = await this.prisma.trackingLink.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`추적 링크 수정: id=${id}`);
    return link;
  }

  async remove(id: number) {
    const existing = await this.prisma.trackingLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`추적 링크 #${id}를 찾을 수 없습니다.`);
    }

    await this.prisma.trackingLink.delete({ where: { id } });
    this.logger.log(`추적 링크 삭제: id=${id}, code=${existing.code}`);

    return { deleted: true, id };
  }

  // 클릭 기록 실패 로깅 (컨트롤러에서 호출)
  logClickError(error: unknown, code: string): void {
    this.logger.warn(`클릭 기록 실패: code=${code}, error=${String(error)}`);
  }

  async recordClick(code: string, ip: string, userAgent: string) {
    // 추적 링크 조회
    const link = await this.prisma.trackingLink.findUnique({
      where: { code },
    });

    if (!link) {
      throw new NotFoundException(`추적 코드 '${code}'를 찾을 수 없습니다.`);
    }

    // 비활성 링크는 클릭 기록하지 않음
    if (!link.isActive) {
      return { recorded: false, reason: 'inactive', targetUrl: link.targetUrl };
    }

    const botDetected = this.isBot(userAgent);

    // 클릭 기록 저장
    await this.prisma.linkClick.create({
      data: {
        trackingLinkId: link.id,
        ipAddress: ip || null,
        userAgent: userAgent || null,
        isBot: botDetected,
      },
    });

    this.logger.log(
      `클릭 기록: code=${code}, ip=${ip}, isBot=${botDetected}`,
    );

    return {
      recorded: true,
      targetUrl: link.targetUrl,
      isBot: botDetected,
    };
  }
}
