import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // PageView 기록
  async trackPageView(
    path: string,
    ipAddress: string,
    userAgent: string,
    isBot: boolean,
    referer?: string,
  ) {
    return await this.prisma.pageView.create({
      data: {
        path,
        ipAddress,
        userAgent,
        isBot,
        referer,
      },
    });
  }

  // 사이트 전체 통계 (기간별)
  async getSiteStats(days?: number) {
    const startDate = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      : new Date(0); // 전체 기간

    // 총 페이지뷰 (봇 제외)
    const totalPageViews = await this.prisma.pageView.count({
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
    });

    // 고유 방문자 수 (봇 제외)
    const uniqueVisitors = await this.prisma.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
      _count: true,
    });

    // 일별 통계
    const dailyStats = await this.prisma.$queryRaw<
      Array<{ date: string; views: bigint }>
    >`
      SELECT
        DATE("viewedAt") as date,
        COUNT(*)::bigint as views
      FROM "PageView"
      WHERE "isBot" = false
        AND "viewedAt" >= ${startDate}
      GROUP BY DATE("viewedAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    // 인기 페이지 TOP 5
    const topPages = await this.prisma.pageView.groupBy({
      by: ['path'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: 'desc',
        },
      },
      take: 5,
    });

    // 평균 조회수/일
    const avgViewsPerDay =
      days && dailyStats.length > 0
        ? Math.round(totalPageViews / days)
        : totalPageViews;

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      avgViewsPerDay,
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        views: Number(stat.views),
      })),
      topPages: topPages.map((page) => ({
        path: page.path,
        views: page._count.path,
      })),
    };
  }

  // 특정 월의 일별 통계
  async getSiteStatsByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 총 페이지뷰 (봇 제외)
    const totalPageViews = await this.prisma.pageView.count({
      where: {
        isBot: false,
        viewedAt: { gte: startDate, lte: endDate },
      },
    });

    // 고유 방문자 수 (봇 제외)
    const uniqueVisitors = await this.prisma.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    // 일별 통계
    const dailyStats = await this.prisma.$queryRaw<
      Array<{ date: string; views: bigint }>
    >`
      SELECT
        DATE("viewedAt") as date,
        COUNT(*)::bigint as views
      FROM "PageView"
      WHERE "isBot" = false
        AND "viewedAt" >= ${startDate}
        AND "viewedAt" <= ${endDate}
      GROUP BY DATE("viewedAt")
      ORDER BY date ASC
    `;

    // 인기 페이지 TOP 5
    const topPages = await this.prisma.pageView.groupBy({
      by: ['path'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate, lte: endDate },
      },
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: 'desc',
        },
      },
      take: 5,
    });

    // 평균 조회수/일
    const daysInMonth = dailyStats.length;
    const avgViewsPerDay =
      daysInMonth > 0 ? Math.round(totalPageViews / daysInMonth) : totalPageViews;

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      avgViewsPerDay,
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        views: Number(stat.views),
      })),
      topPages: topPages.map((page) => ({
        path: page.path,
        views: page._count.path,
      })),
    };
  }

  // 사이트 전체 월별 통계
  async getSiteMonthlyStats(months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // 월별 페이지뷰 통계
    const monthlyStats = await this.prisma.$queryRaw<
      Array<{ month: string; views: bigint; visitors: bigint }>
    >`
      SELECT
        TO_CHAR("viewedAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as views,
        COUNT(DISTINCT "ipAddress")::bigint as visitors
      FROM "PageView"
      WHERE "isBot" = false
        AND "viewedAt" >= ${startDate}
      GROUP BY TO_CHAR("viewedAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    // 전체 기간 통계
    const totalPageViews = await this.prisma.pageView.count({
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
    });

    const uniqueVisitors = await this.prisma.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
      _count: true,
    });

    // 인기 페이지 TOP 5
    const topPages = await this.prisma.pageView.groupBy({
      by: ['path'],
      where: {
        isBot: false,
        viewedAt: { gte: startDate },
      },
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: 'desc',
        },
      },
      take: 5,
    });

    // 평균 조회수/월
    const avgViewsPerMonth =
      monthlyStats.length > 0
        ? Math.round(totalPageViews / monthlyStats.length)
        : totalPageViews;

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      avgViewsPerMonth,
      monthlyStats: monthlyStats.map((stat) => ({
        month: stat.month,
        views: Number(stat.views),
        visitors: Number(stat.visitors),
      })),
      topPages: topPages.map((page) => ({
        path: page.path,
        views: page._count.path,
      })),
    };
  }

  // 정비사별 월별 클릭 통계
  async getMechanicMonthlyClicks(mechanicId: number, months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyData = await this.prisma.$queryRaw<
      Array<{ month: string; clicks: bigint }>
    >`
      SELECT
        TO_CHAR("clickedAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as clicks
      FROM "ClickLog"
      WHERE "mechanicId" = ${mechanicId}
        AND "isBot" = false
        AND "clickedAt" >= ${startDate}
      GROUP BY TO_CHAR("clickedAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    return monthlyData.map((data) => ({
      month: data.month,
      clicks: Number(data.clicks),
    }));
  }

  // 전체 정비사 월별 클릭 통계
  async getAllMechanicsMonthlyClicks(months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // SQL JOIN으로 한 번에 조회하여 N+1 문제 해결
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        monthlyClicks: Array<{ month: string; count: number }>;
      }>
    >`
      WITH monthly_stats AS (
        SELECT
          cl."mechanicId",
          TO_CHAR(cl."clickedAt", 'YYYY-MM') as month,
          COUNT(*) as count
        FROM "ClickLog" cl
        WHERE cl."isBot" = false
          AND cl."clickedAt" >= ${startDate}
        GROUP BY cl."mechanicId", TO_CHAR(cl."clickedAt", 'YYYY-MM')
      )
      SELECT
        m.id,
        m.name,
        COALESCE(
          json_agg(
            json_build_object('month', ms.month, 'count', ms.count)
            ORDER BY ms.month
          ) FILTER (WHERE ms.month IS NOT NULL),
          '[]'
        ) as "monthlyClicks"
      FROM "Mechanic" m
      LEFT JOIN monthly_stats ms ON m.id = ms."mechanicId"
      WHERE m."isActive" = true
      GROUP BY m.id, m.name
      ORDER BY m.id
    `;

    return result;
  }

  // 특정 월의 인기 정비사 TOP N
  async getTopMechanicsByMonth(
    year: number,
    month: number,
    limit: number = 5,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const clickData = await this.prisma.$queryRaw<
      Array<{ mechanicId: number; clickCount: bigint }>
    >`
      SELECT
        "mechanicId",
        COUNT(*)::bigint as "clickCount"
      FROM "ClickLog"
      WHERE "isBot" = false
        AND "clickedAt" >= ${startDate}
        AND "clickedAt" <= ${endDate}
      GROUP BY "mechanicId"
      ORDER BY "clickCount" DESC
      LIMIT ${limit}
    `;

    // 정비사 상세 정보 조회
    const mechanicIds = clickData.map((d) => d.mechanicId);
    if (mechanicIds.length === 0) {
      return [];
    }

    const mechanics = await this.prisma.mechanic.findMany({
      where: { id: { in: mechanicIds }, isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        clickCount: true,
      },
    });

    // clickCount를 기간별 데이터로 병합 (순서 유지)
    return mechanicIds
      .map((id) => {
        const mechanic = mechanics.find((m) => m.id === id);
        const clicks = clickData.find((d) => d.mechanicId === id);

        if (!mechanic || !clicks) {
          return null;
        }

        return {
          id: mechanic.id,
          name: mechanic.name,
          phone: mechanic.phone,
          address: mechanic.address,
          clickCount: Number(clicks.clickCount),
        };
      })
      .filter((m) => m !== null);
  }

  // 기간별 인기 정비사 TOP N
  async getTopMechanics(
    period: 'realtime' | 'daily' | 'monthly',
    limit: number = 5,
    days: number = 7,
    months: number = 6,
  ) {
    if (period === 'realtime') {
      // 실시간: mechanic.clickCount 기준
      const mechanics = await this.prisma.mechanic.findMany({
        where: { isActive: true },
        orderBy: { clickCount: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          clickCount: true,
          phone: true,
          address: true,
        },
      });
      return mechanics;
    }

    // daily 또는 monthly: ClickLog 집계
    let startDate: Date;
    if (period === 'daily') {
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    } else {
      // monthly
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
    }

    const clickData = await this.prisma.$queryRaw<
      Array<{ mechanicId: number; clickCount: bigint }>
    >`
      SELECT
        "mechanicId",
        COUNT(*)::bigint as "clickCount"
      FROM "ClickLog"
      WHERE "isBot" = false
        AND "clickedAt" >= ${startDate}
      GROUP BY "mechanicId"
      ORDER BY "clickCount" DESC
      LIMIT ${limit}
    `;

    // 정비사 상세 정보 조회
    const mechanicIds = clickData.map((d) => d.mechanicId);
    if (mechanicIds.length === 0) {
      return [];
    }

    const mechanics = await this.prisma.mechanic.findMany({
      where: { id: { in: mechanicIds }, isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        clickCount: true,
      },
    });

    // clickCount를 기간별 데이터로 병합 (순서 유지)
    return mechanicIds
      .map((id) => {
        const mechanic = mechanics.find((m) => m.id === id);
        const clicks = clickData.find((d) => d.mechanicId === id);

        // mechanic 또는 clicks가 없으면 null 반환
        if (!mechanic || !clicks) {
          return null;
        }

        return {
          id: mechanic.id,
          name: mechanic.name,
          phoneNumber: mechanic.phone,
          address: mechanic.address,
          clickCount: Number(clicks.clickCount),
        };
      })
      .filter((m) => m !== null); // null 제거
  }
}
