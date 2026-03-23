import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

/**
 * null 값을 Prisma.JsonNull로 변환 (Json? 필드용)
 */
function toJsonField(value: any): any {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return undefined;
  return value;
}

@Injectable()
export class OwnerService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // ── 관리자용: 사용자 목록 (businessStatus 필터 지원) ──

  async findAll(status?: string) {
    let where: any = {};

    if (status === 'DEACTIVATED') {
      // 탈퇴 탭: deactivatedAt이 있는 유저
      where = { deactivatedAt: { not: null } };
    } else if (status) {
      // 특정 상태 필터: 탈퇴 회원 제외
      where = { businessStatus: status as any, deactivatedAt: null };
    } else {
      // 전체 탭: 탈퇴 회원 제외
      where = { deactivatedAt: null };
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        businessStatus: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        phone: true,
        address: true,
        isProtected: true,
        deactivatedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { mechanics: true } },
      },
    });
  }

  // ── 관리자용: 사용자 상세 ──

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        businessStatus: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        phone: true,
        address: true,
        isProtected: true,
        deactivatedAt: true,
        createdAt: true,
        _count: { select: { mechanics: true } },
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  // ── 관리자용: 승인 ──

  async approve(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id },
      data: { businessStatus: 'APPROVED', rejectionReason: null },
    });
  }

  // ── 관리자용: 거절 ──

  async reject(id: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id },
      data: { businessStatus: 'REJECTED', rejectionReason: reason || null },
    });
  }

  // ── 사용자용: 재신청 (거절된 상태에서 사업자등록증 재제출) ──

  async reapply(
    userId: number,
    data: {
      businessLicenseUrl: string;
      businessName: string;
      nickname?: string;
      phone?: string;
      address?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (user.businessStatus !== 'REJECTED') {
      throw new ForbiddenException('거절 상태에서만 재신청할 수 있습니다.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        businessStatus: 'PENDING',
        rejectionReason: null,
        businessLicenseUrl: data.businessLicenseUrl,
        businessName: data.businessName,
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.phone && { phone: data.phone }),
        ...(data.address && { address: data.address }),
      },
    });

    // 텔레그램 알림 (실패해도 무시)
    this.notificationService
      .sendTelegramMessage(
        `사용자 재신청\n\n닉네임: ${data.nickname || user.nickname || '이름 없음'}\n상호: ${data.businessName}\n주소: ${data.address || user.address || '주소 없음'}\n전화: ${data.phone || user.phone || '전화번호 없음'}\n\n관리자 페이지에서 확인: https://dreammechaniclab.com/admin/users`,
      )
      .catch(() => {});

    return updated;
  }

  // ── 사용자용: 사업자등록증 제출 ──

  async submitBusinessLicense(userId: number, businessLicenseUrl: string, businessName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id: userId },
      data: { businessLicenseUrl, businessName },
    });
  }

  // ── 사용자용: 사업자 정보 제출 (이름, 전화, 주소, 상호, 사업자등록증) ──

  async submitBusinessInfo(
    userId: number,
    data: {
      name: string;
      phone: string;
      address: string;
      businessName: string;
      businessLicenseUrl: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: data.name,
        phone: data.phone,
        address: data.address,
        businessName: data.businessName,
        businessLicenseUrl: data.businessLicenseUrl,
        businessStatus: 'PENDING',
        rejectionReason: null,
      },
    });

    // 텔레그램 알림 발송 (실패해도 무시)
    this.notificationService
      .sendTelegramMessage(
        `사장님 사업자 정보 제출\n\n닉네임: ${data.name}\n상호: ${data.businessName}\n주소: ${data.address}\n전화: ${data.phone}\n\n관리자 페이지에서 확인: https://dreammechaniclab.com/admin/users`,
      )
      .catch(() => {});

    return updated;
  }

  // ── 사용자용: 내 매장 목록 ──

  async getMyMechanics(userId: number) {
    const mechanics = await this.prisma.mechanic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return mechanics.map((m) => ({
      ...m,
      mapLat: Number(m.mapLat),
      mapLng: Number(m.mapLng),
    }));
  }

  // ── 사용자용: 매장 등록 ──

  async createMechanic(userId: number, data: any) {
    // 카카오톡 1계정 = 정비소 1개 제한
    const existingCount = await this.prisma.mechanic.count({
      where: { userId, isActive: true },
    });
    if (existingCount >= 1) {
      throw new BadRequestException('하나의 계정으로 정비소는 1개만 등록할 수 있습니다.');
    }

    // Json? 필드의 null 처리
    const createData: any = { ...data };
    if ('operatingHours' in createData) createData.operatingHours = toJsonField(createData.operatingHours);
    if ('holidays' in createData) createData.holidays = toJsonField(createData.holidays);

    const mechanic = await this.prisma.mechanic.create({
      data: {
        ...createData,
        userId,
        galleryImages: createData.galleryImages || [],
      },
    });

    return {
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    };
  }

  // ── 사용자용: 매장 수정 (본인 매장만) ──

  async updateMechanic(userId: number, mechanicId: number, data: any) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic) throw new NotFoundException('매장을 찾을 수 없습니다.');
    if (mechanic.userId !== userId) throw new ForbiddenException('본인 매장만 수정할 수 있습니다.');

    // Json? 필드의 null 처리
    const processedData: any = { ...data };
    if ('operatingHours' in processedData) processedData.operatingHours = toJsonField(processedData.operatingHours);
    if ('holidays' in processedData) processedData.holidays = toJsonField(processedData.holidays);

    const updated = await this.prisma.mechanic.update({
      where: { id: mechanicId },
      data: processedData,
    });

    return {
      ...updated,
      mapLat: Number(updated.mapLat),
      mapLng: Number(updated.mapLng),
    };
  }

  // ── 사용자용: 프로필 조회 ──

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        businessStatus: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        businessName: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  // ── KST 기준 특정 월의 시작/끝을 UTC로 변환 (analytics.service.ts 패턴 동일) ──

  private getKstMonthRange(year: number, month: number): { startDate: Date; endDate: Date } {
    const kstStart = new Date(year, month - 1, 1, 0, 0, 0);
    const startDate = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);
    const kstEnd = new Date(year, month, 0, 23, 59, 59);
    const endDate = new Date(kstEnd.getTime() - 9 * 60 * 60 * 1000);
    return { startDate, endDate };
  }

  // ── KST 기준 ISO 주차의 월~일 범위를 UTC로 변환 ──

  private getKstWeekRange(year: number, week: number): {
    startDate: Date;
    endDate: Date;
    weekStart: string;
    weekEnd: string;
  } {
    // ISO 8601: 1월 4일은 항상 첫째 주에 포함
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // 일요일=7
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - dayOfWeek + 1); // 첫째 주 월요일

    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (week - 1) * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // KST 00:00 → UTC
    const kstStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0);
    const startDate = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);

    // KST 23:59:59 → UTC
    const kstEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59);
    const endDate = new Date(kstEnd.getTime() - 9 * 60 * 60 * 1000);

    // 프론트엔드 표시용 날짜 문자열 (예: "2026-03-02")
    const pad = (n: number) => String(n).padStart(2, '0');
    const weekStart = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    const weekEnd = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

    return { startDate, endDate, weekStart, weekEnd };
  }

  // ── ISO 주차 계산 유틸 ──

  private _getISOWeek(date: Date): { year: number; week: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week };
  }

  // ── period 파싱 유틸: "YYYY-MM" → { year, month, periodStr } (기존 유지) ──

  private _parsePeriod(period?: string): { year: number; month: number; periodStr: string } {
    let year: number;
    let month: number;

    if (period && /^\d{4}-\d{2}$/.test(period)) {
      const [y, m] = period.split('-').map(Number);
      year = y;
      month = m;
    } else {
      // KST 기준 현재 월
      const now = new Date();
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      year = kstNow.getFullYear();
      month = kstNow.getMonth() + 1;
    }

    const periodStr = `${year}-${String(month).padStart(2, '0')}`;
    return { year, month, periodStr };
  }

  // ── period 파싱 유틸: "YYYY-Www" → { year, week, periodStr } ──

  private _parseWeekPeriod(period?: string): { year: number; week: number; periodStr: string } {
    if (period && /^\d{4}-W\d{2}$/.test(period)) {
      const [yearStr, weekStr] = period.split('-W');
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      return { year, week, periodStr: period };
    }

    // KST 기준 현재 ISO 주차 계산
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const { year, week } = this._getISOWeek(kstNow);
    return { year, week, periodStr: `${year}-W${String(week).padStart(2, '0')}` };
  }

  // ── 공통 통계 쿼리: mechanicIds를 받아 리포트 데이터 반환 (주간 기준) ──

  private async _generateReport(
    mechanicIds: number[],
    period?: string,
    extraInfo?: { mechanicName?: string; mechanicLocation?: string },
  ) {
    const { year, week, periodStr } = this._parseWeekPeriod(period);
    const { startDate, endDate, weekStart, weekEnd } = this.getKstWeekRange(year, week);

    // 이전 주 범위
    const prevWeek = week === 1 ? 52 : week - 1;
    const prevYear = week === 1 ? year - 1 : year;
    const { startDate: prevStartDate, endDate: prevEndDate } = this.getKstWeekRange(prevYear, prevWeek);

    // 이번 주 통계: 페이지뷰, 고유 방문자, 전화번호 공개 병렬 조회
    const [pageViews, uniqueVisitorsRaw, phoneReveals] = await Promise.all([
      this.prisma.clickLog.count({
        where: {
          mechanicId: { in: mechanicIds },
          isBot: false,
          clickedAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.clickLog.groupBy({
        by: ['ipAddress'],
        where: {
          mechanicId: { in: mechanicIds },
          isBot: false,
          clickedAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.phoneRevealLog.count({
        where: {
          mechanicId: { in: mechanicIds },
          isBot: false,
          revealedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const uniqueVisitors = uniqueVisitorsRaw.length;
    const conversionRate =
      pageViews > 0 ? Math.round((phoneReveals / pageViews) * 100 * 10) / 10 : 0;

    // 이전 주 통계
    const [prevPageViews, prevPhoneReveals] = await Promise.all([
      this.prisma.clickLog.count({
        where: {
          mechanicId: { in: mechanicIds },
          isBot: false,
          clickedAt: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
      this.prisma.phoneRevealLog.count({
        where: {
          mechanicId: { in: mechanicIds },
          isBot: false,
          revealedAt: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
    ]);

    const pageViewsDelta =
      prevPageViews > 0
        ? Math.round(((pageViews - prevPageViews) / prevPageViews) * 100)
        : pageViews > 0
          ? 100
          : 0;
    const phoneRevealsDelta =
      prevPhoneReveals > 0
        ? Math.round(((phoneReveals - prevPhoneReveals) / prevPhoneReveals) * 100)
        : phoneReveals > 0
          ? 100
          : 0;

    // 일별 페이지뷰 (KST 기준, raw SQL, 해당 주 7일)
    const dailyViewsRaw = await this.prisma.$queryRaw<
      Array<{ date: string; views: bigint }>
    >`
      SELECT DATE("clickedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(*)::bigint as views
      FROM "ClickLog"
      WHERE "mechanicId" = ANY(${mechanicIds}::int[]) AND "isBot" = false
        AND "clickedAt" >= ${startDate} AND "clickedAt" <= ${endDate}
      GROUP BY date ORDER BY date ASC
    `;

    const dailyViews = dailyViewsRaw.map((d) => ({
      date: String(d.date),
      views: Number(d.views),
    }));

    // 지역 랭킹: extraInfo.mechanicLocation 우선, 없으면 첫 번째 정비소 조회
    let myLocation = extraInfo?.mechanicLocation ?? '';
    if (!myLocation && mechanicIds.length > 0) {
      const firstMechanic = await this.prisma.mechanic.findUnique({
        where: { id: mechanicIds[0] },
        select: { location: true },
      });
      myLocation = firstMechanic?.location ?? '';
    }

    let rank = 0;
    let total = 0;
    if (myLocation) {
      const regionMechanics = await this.prisma.mechanic.findMany({
        where: { isActive: true, location: { contains: myLocation, mode: 'insensitive' } },
        select: { id: true },
      });
      const regionMechanicIds = regionMechanics.map((m) => m.id);

      const regionClicksRaw = await this.prisma.clickLog.groupBy({
        by: ['mechanicId'],
        where: {
          mechanicId: { in: regionMechanicIds },
          isBot: false,
          clickedAt: { gte: startDate, lte: endDate },
        },
        _count: { mechanicId: true },
        orderBy: { _count: { mechanicId: 'desc' } },
      });

      total = regionClicksRaw.length;
      const myRankIndex = regionClicksRaw.findIndex((r) => mechanicIds.includes(r.mechanicId));
      rank = myRankIndex === -1 ? total + 1 : myRankIndex + 1;
    }

    // 프리미엄(인증) 비교: 인증 정비소 평균 vs 내 정비소
    const verifiedMechanics = await this.prisma.mechanic.findMany({
      where: { isVerified: true, isActive: true },
      select: { id: true },
    });
    const verifiedIds = verifiedMechanics.map((m) => m.id);

    let avgPhoneReveals = 0;
    if (verifiedIds.length > 0) {
      const verifiedPhoneReveals = await this.prisma.phoneRevealLog.count({
        where: {
          mechanicId: { in: verifiedIds },
          isBot: false,
          revealedAt: { gte: startDate, lte: endDate },
        },
      });
      avgPhoneReveals = Math.round((verifiedPhoneReveals / verifiedIds.length) * 10) / 10;
    }

    const multiplier =
      avgPhoneReveals > 0 ? Math.round((phoneReveals / avgPhoneReveals) * 10) / 10 : 0;

    // 인증 여부: mechanicIds 중 isVerified=true 존재 확인
    const verifiedCount = await this.prisma.mechanic.count({
      where: { id: { in: mechanicIds }, isVerified: true },
    });
    const isPremium = verifiedCount > 0;

    const result: Record<string, unknown> = {
      period: periodStr,
      weekStart,
      weekEnd,
      totals: { pageViews, uniqueVisitors, phoneReveals, conversionRate },
      previousWeek: {
        pageViews: prevPageViews,
        phoneReveals: prevPhoneReveals,
        pageViewsDelta,
        phoneRevealsDelta,
      },
      dailyViews,
      regionRanking: { region: myLocation, rank, total },
      premiumComparison: { avgPhoneReveals, myPhoneReveals: phoneReveals, multiplier },
      isPremium,
    };

    if (extraInfo?.mechanicName !== undefined) {
      result.mechanicName = extraInfo.mechanicName;
    }
    if (extraInfo?.mechanicLocation !== undefined) {
      result.mechanicLocation = extraInfo.mechanicLocation;
    }

    return result;
  }

  // ── 사용자용: 주간 성과 리포트 ──

  async getWeeklyReport(userId: number, period?: string) {
    const { periodStr } = this._parseWeekPeriod(period);

    // 사용자의 활성 정비소 목록 조회
    const mechanics = await this.prisma.mechanic.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, location: true, isVerified: true },
    });

    // 정비소 없음: 빈 리포트 반환
    if (mechanics.length === 0) {
      return {
        period: periodStr,
        weekStart: '',
        weekEnd: '',
        totals: { pageViews: 0, uniqueVisitors: 0, phoneReveals: 0, conversionRate: 0 },
        previousWeek: { pageViews: 0, phoneReveals: 0, pageViewsDelta: 0, phoneRevealsDelta: 0 },
        dailyViews: [],
        regionRanking: { region: '', rank: 0, total: 0 },
        premiumComparison: { avgPhoneReveals: 0, myPhoneReveals: 0, multiplier: 0 },
        isPremium: false,
      };
    }

    const mechanicIds = mechanics.map((m) => m.id);
    return this._generateReport(mechanicIds, period, {
      mechanicLocation: mechanics[0].location,
    });
  }

  // ── 관리자용: 특정 정비소 ID 기준 주간 성과 리포트 ──

  async getWeeklyReportByMechanicId(mechanicId: number, period?: string) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: mechanicId },
      select: { id: true, name: true, location: true },
    });

    if (!mechanic) throw new NotFoundException('정비소를 찾을 수 없습니다.');

    return this._generateReport([mechanicId], period, {
      mechanicName: mechanic.name,
      mechanicLocation: mechanic.location,
    });
  }

  // ── 리포트 공유 토큰 생성 (HMAC-SHA256, 30일 유효) ──

  generateReportShareToken(mechanicId: number): { token: string; expiresAt: string } {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const payload = Buffer.from(JSON.stringify({ mechanicId, expiresAt })).toString('base64url');
    const signature = createHmac('sha256', process.env.JWT_SECRET!)
      .update(payload)
      .digest('base64url');
    return { token: `${payload}.${signature}`, expiresAt };
  }

  // ── 리포트 공유 토큰 검증 ──

  verifyReportShareToken(token: string): { mechanicId: number } {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) throw new BadRequestException('잘못된 토큰');

    const payload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    if (!payload || !signature) throw new BadRequestException('잘못된 토큰');

    const expectedSig = createHmac('sha256', process.env.JWT_SECRET!)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSig) throw new BadRequestException('잘못된 토큰');

    let data: { mechanicId: number; expiresAt: string };
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new BadRequestException('잘못된 토큰');
    }

    if (new Date(data.expiresAt) < new Date()) throw new BadRequestException('만료된 링크');

    return { mechanicId: data.mechanicId };
  }

  // ── 사용자용: 내 정비소를 선택한 고객 문의 조회 ──

  async getMyInquiries(userId: number) {
    // 1. 사용자의 정비소 목록 조회
    const mechanics = await this.prisma.mechanic.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });
    const mechanicIds = mechanics.map((m) => m.id);

    if (mechanicIds.length === 0) return [];

    // 2. 해당 정비소를 선택한 ServiceInquiry 조회
    return this.prisma.serviceInquiry.findMany({
      where: { mechanicId: { in: mechanicIds } },
      include: {
        mechanic: {
          select: { id: true, name: true, address: true },
        },
        trackingLink: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 사용자용: 내 문의 상세 조회 ──

  async getMyInquiryDetail(userId: number, inquiryId: number) {
    // 내 정비소 ID 목록
    const mechanics = await this.prisma.mechanic.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });
    const mechanicIds = mechanics.map((m) => m.id);

    const inquiry = await this.prisma.serviceInquiry.findFirst({
      where: {
        id: inquiryId,
        mechanicId: { in: mechanicIds },
      },
      include: {
        mechanic: {
          select: { id: true, name: true, address: true },
        },
        trackingLink: {
          select: { id: true, code: true, name: true, description: true },
        },
      },
    });

    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    return inquiry;
  }

  // ── 사용자용: 공유 링크 클릭 수 증가 ──

  async incrementShareClick(inquiryId: number) {
    return this.prisma.serviceInquiry.update({
      where: { id: inquiryId },
      data: { shareClickCount: { increment: 1 } },
    });
  }

  // ── 사용자용: 가입 문의 ID 기록 (최초 1회, 어떤 공유 링크로 가입했는지 추적) ──

  async setSignupInquiry(userId: number, inquiryId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, signupInquiryId: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // 이미 기록된 경우 덮어쓰지 않음 (최초 가입 경로만 보존)
    if (user.signupInquiryId !== null) {
      return { message: '이미 가입 문의 ID가 기록되어 있습니다.', signupInquiryId: user.signupInquiryId };
    }

    // 해당 ServiceInquiry 존재 여부 확인
    const inquiry = await this.prisma.serviceInquiry.findUnique({
      where: { id: inquiryId },
      select: { id: true },
    });
    if (!inquiry) throw new NotFoundException('해당 문의를 찾을 수 없습니다.');

    await this.prisma.user.update({
      where: { id: userId },
      data: { signupInquiryId: inquiryId },
    });

    return { message: '가입 문의 ID가 기록되었습니다.', signupInquiryId: inquiryId };
  }

  // ── 사용자용: 프로필 업데이트 (전화번호 등) ──

  async updateProfile(userId: number, data: { phone?: string; businessName?: string; address?: string; nickname?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.nickname !== undefined && { nickname: data.nickname }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        phone: true,
        businessName: true,
        address: true,
        businessStatus: true,
      },
    });
  }

  // ── 사용자용: 매장 삭제 (본인 매장만, 소프트 삭제) ──

  async removeMechanic(userId: number, mechanicId: number) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic) throw new NotFoundException('매장을 찾을 수 없습니다.');
    if (mechanic.userId !== userId) throw new ForbiddenException('본인 매장만 삭제할 수 있습니다.');

    return this.prisma.mechanic.update({
      where: { id: mechanicId },
      data: { isActive: false },
    });
  }

  // ── 관리자용: 일반 사용자 목록 (businessStatus: NONE) ──

  async findAllCustomers() {
    return this.prisma.user.findMany({
      where: { businessStatus: 'NONE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        email: true,
        phone: true,
        trackingCode: true,
        createdAt: true,
        _count: { select: { serviceInquiries: true } },
      },
    });
  }

  // ── 관리자용: 사용자 강제 탈퇴 ──

  async deleteCustomer(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // 연결된 Mechanic의 userId를 null로 해제 (정비소는 삭제하지 않고 보존)
    await this.prisma.mechanic.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    // 연결된 ServiceInquiry 삭제 (외래키 제약)
    await this.prisma.serviceInquiry.deleteMany({
      where: { userId: id },
    });

    // User 삭제 (Post/Comment/PostLike는 스키마 onDelete:SetNull으로 자동 처리)
    await this.prisma.user.delete({ where: { id } });

    return { success: true, message: '회원이 삭제되었습니다' };
  }

  // ── 관리자용: 사업자등록증 미승인(PENDING) 목록 조회 ──

  async getPendingApprovalUsers() {
    const now = Date.now();

    const users = await this.prisma.user.findMany({
      where: { businessStatus: 'PENDING' },
      orderBy: { updatedAt: 'asc' }, // 오래된 순서 먼저
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        businessName: true,
        businessLicenseUrl: true,
        phone: true,
        address: true,
        isProtected: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map((u) => ({
      ...u,
      // updatedAt 기준 제출일 경과일수 (사업자 정보 제출 시 updatedAt 갱신)
      submittedAt: u.updatedAt,
      daysElapsedSinceSubmission: Math.floor(
        (now - u.updatedAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
      // 가입일 기준 가입 경과일수
      daysElapsedSinceSignup: Math.floor(
        (now - u.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
    }));
  }

  // ── 관리자용: 배지 통합 조회 ──

  async getAdminBadges() {
    const [
      unreadInquiries,
      pendingServiceInquiries,
      pendingQuoteRequests,
      pendingTireInquiries,
      newMechanics,
      newCustomers,
      pendingOwners,
      pendingReviews,
    ] = await Promise.all([
      this.prisma.inquiry.count({ where: { isRead: false } }),
      this.prisma.serviceInquiry.count({ where: { status: 'PENDING' } }),
      this.prisma.quoteRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.tireInquiry.count({ where: { status: 'PENDING' } }),
      this.prisma.mechanic.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, isActive: true },
      }),
      this.prisma.user.count({
        where: { businessStatus: 'NONE', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.user.count({ where: { businessStatus: 'PENDING' } }),
      this.prisma.review.count({ where: { isApproved: false, isActive: true } }),
    ]);

    return {
      unified: unreadInquiries + pendingServiceInquiries + pendingQuoteRequests + pendingTireInquiries,
      mechanics: newMechanics,
      customers: newCustomers,
      owners: pendingOwners,
      reviews: pendingReviews,
    };
  }

  // ── 관리자용: 사용자 탈퇴 (소프트 삭제) ──

  async deactivateOwner(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // 보호 계정은 탈퇴 불가
    if (user.isProtected) {
      throw new BadRequestException('보호 계정은 탈퇴시킬 수 없습니다.');
    }

    // 사용자 비활성화 (deactivatedAt 기록 + businessStatus 초기화)
    await this.prisma.user.update({
      where: { id },
      data: {
        deactivatedAt: new Date(),
      },
    });

    // 소속 Mechanic 전체 비활성화
    await this.prisma.mechanic.updateMany({
      where: { userId: id },
      data: { isActive: false },
    });

    // 텔레그램 알림 (실패해도 무시)
    this.notificationService
      .sendTelegramMessage(
        `정비사 탈퇴 처리\n\n닉네임: ${user.nickname || '이름 없음'}\n이메일: ${user.email || '이메일 없음'}\nUser ID: ${id}\n\n관리자에 의해 탈퇴 처리되었습니다.`,
      )
      .catch(() => {});

    return { message: '탈퇴 처리되었습니다.' };
  }

  // ── 관리자용: 사용자 복원 ──

  async reactivateOwner(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // deactivatedAt이 없으면 복원 불필요
    if (!user.deactivatedAt) {
      throw new BadRequestException('탈퇴 상태의 계정만 복원할 수 있습니다.');
    }

    // 사용자 복원 (APPROVED 상태로)
    await this.prisma.user.update({
      where: { id },
      data: {
        businessStatus: 'APPROVED',
        deactivatedAt: null,
      },
    });

    // 소속 Mechanic 재활성화
    await this.prisma.mechanic.updateMany({
      where: { userId: id },
      data: { isActive: true },
    });

    return { message: '복원되었습니다.' };
  }

  // ── 관리자용: 보호 계정 설정/해제 ──

  async toggleProtected(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isProtected: !user.isProtected },
      select: {
        id: true,
        nickname: true,
        isProtected: true,
        businessStatus: true,
      },
    });

    return {
      ...updated,
      message: updated.isProtected ? '보호 계정으로 설정되었습니다.' : '보호 계정이 해제되었습니다.',
    };
  }
}
