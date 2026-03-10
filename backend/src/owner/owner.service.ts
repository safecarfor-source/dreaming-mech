import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    const where = status ? { businessStatus: status as any } : {};
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

  // ── 사용자용: 월별 성과 리포트 ──

  async getMonthlyReport(userId: number, period?: string) {
    // period 파싱 (기본: 현재 YYYY-MM KST 기준)
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
    const { startDate, endDate } = this.getKstMonthRange(year, month);

    // 이전 달 범위
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const { startDate: prevStartDate, endDate: prevEndDate } = this.getKstMonthRange(prevYear, prevMonth);

    // 사용자의 활성 정비소 목록 조회
    const mechanics = await this.prisma.mechanic.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, location: true, isVerified: true },
    });

    // 정비소 없음: 빈 리포트 반환
    if (mechanics.length === 0) {
      return {
        period: periodStr,
        totals: { pageViews: 0, uniqueVisitors: 0, phoneReveals: 0, conversionRate: 0 },
        previousMonth: { pageViews: 0, phoneReveals: 0, pageViewsDelta: 0, phoneRevealsDelta: 0 },
        dailyViews: [],
        regionRanking: { region: '', rank: 0, total: 0 },
        premiumComparison: { avgPhoneReveals: 0, myPhoneReveals: 0, multiplier: 0 },
        isPremium: false,
      };
    }

    const mechanicIds = mechanics.map((m) => m.id);

    // 이번 달 통계: 페이지뷰, 고유 방문자, 전화번호 공개 병렬 조회
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
    const conversionRate = pageViews > 0
      ? Math.round((phoneReveals / pageViews) * 100 * 10) / 10
      : 0;

    // 이전 달 통계
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

    const pageViewsDelta = prevPageViews > 0
      ? Math.round(((pageViews - prevPageViews) / prevPageViews) * 100)
      : pageViews > 0 ? 100 : 0;
    const phoneRevealsDelta = prevPhoneReveals > 0
      ? Math.round(((phoneReveals - prevPhoneReveals) / prevPhoneReveals) * 100)
      : phoneReveals > 0 ? 100 : 0;

    // 일별 페이지뷰 (KST 기준, raw SQL)
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

    // 지역 랭킹: 내 첫 번째 정비소 location 기준
    const myLocation = mechanics[0].location;
    const regionMechanics = await this.prisma.mechanic.findMany({
      where: { isActive: true, location: { contains: myLocation, mode: 'insensitive' } },
      select: { id: true },
    });
    const regionMechanicIds = regionMechanics.map((m) => m.id);

    // 같은 지역 정비소별 이번 달 클릭 수 집계
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

    const total = regionClicksRaw.length;
    // 내 정비소가 랭킹 목록에 있는지 확인
    const myRankIndex = regionClicksRaw.findIndex((r) =>
      mechanicIds.includes(r.mechanicId),
    );
    const rank = myRankIndex === -1 ? total + 1 : myRankIndex + 1;

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
      avgPhoneReveals = Math.round(verifiedPhoneReveals / verifiedIds.length * 10) / 10;
    }

    const multiplier = avgPhoneReveals > 0
      ? Math.round((phoneReveals / avgPhoneReveals) * 10) / 10
      : 0;

    const isPremium = mechanics.some((m) => m.isVerified);

    return {
      period: periodStr,
      totals: { pageViews, uniqueVisitors, phoneReveals, conversionRate },
      previousMonth: { pageViews: prevPageViews, phoneReveals: prevPhoneReveals, pageViewsDelta, phoneRevealsDelta },
      dailyViews,
      regionRanking: { region: myLocation, rank, total },
      premiumComparison: { avgPhoneReveals, myPhoneReveals: phoneReveals, multiplier },
      isPremium,
    };
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

    // 관련 ServiceInquiry 먼저 삭제
    await this.prisma.serviceInquiry.deleteMany({
      where: { userId: id },
    });

    await this.prisma.user.delete({ where: { id } });
    return { message: '사용자가 탈퇴 처리되었습니다.' };
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
