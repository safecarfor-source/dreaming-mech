import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UnifiedInquiry {
  id: number;
  type: 'GENERAL' | 'SERVICE' | 'QUOTE' | 'TIRE';
  name?: string;
  phone?: string;
  regionSido?: string;
  regionSigungu?: string;
  serviceType?: string;
  description?: string;
  status: string;
  createdAt: string;
  shareUrl: string;
  // 추가 정보
  businessName?: string; // GENERAL (정비사 문의)
  carModel?: string; // QUOTE
  mechanicName?: string; // QUOTE
  trackingLinkName?: string; // 유입 경로 (추적 링크 이름)
}

@Injectable()
export class UnifiedInquiryService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20) {
    // 3개 테이블에서 병렬 조회
    const [inquiries, serviceInquiries, quoteRequests, tireInquiries] = await Promise.all([
      this.prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceInquiry.findMany({
        include: {
          customer: {
            select: { id: true, nickname: true, phone: true },
          },
          trackingLink: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quoteRequest.findMany({
        include: {
          mechanic: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tireInquiry.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 통합 매핑
    const unified: UnifiedInquiry[] = [];

    // Inquiry → GENERAL
    for (const inq of inquiries) {
      unified.push({
        id: inq.id,
        type: 'GENERAL',
        name: inq.name,
        phone: inq.phone,
        description: inq.content,
        businessName: inq.businessName || undefined,
        status: inq.isRead ? (inq.reply ? 'COMPLETED' : 'SHARED') : 'PENDING',
        createdAt: inq.createdAt.toISOString(),
        shareUrl: `https://dreammechaniclab.com/inquiry/general/${inq.id}`,
      });
    }

    // ServiceInquiry → SERVICE
    for (const svc of serviceInquiries) {
      unified.push({
        id: svc.id,
        type: 'SERVICE',
        name: (svc as any).name || svc.customer?.nickname || undefined,
        phone: svc.phone || svc.customer?.phone || undefined,
        regionSido: svc.regionSido,
        regionSigungu: svc.regionSigungu,
        serviceType: svc.serviceType,
        description: svc.description || undefined,
        status: svc.status,
        createdAt: svc.createdAt.toISOString(),
        shareUrl: `https://dreammechaniclab.com/inquiry/service/${svc.id}`,
        trackingLinkName: svc.trackingLink?.name || undefined,
      });
    }

    // QuoteRequest → QUOTE
    for (const qr of quoteRequests) {
      unified.push({
        id: qr.id,
        type: 'QUOTE',
        name: qr.customerName,
        phone: qr.customerPhone,
        carModel: qr.carModel || undefined,
        description: qr.description || undefined,
        mechanicName: qr.mechanic?.name || undefined,
        status: qr.status === 'PENDING' ? 'PENDING' : qr.status === 'COMPLETED' ? 'COMPLETED' : 'SHARED',
        createdAt: qr.createdAt.toISOString(),
        shareUrl: `https://dreammechaniclab.com/inquiry/quote/${qr.id}`,
      });
    }

    // TireInquiry → TIRE
    const TIRE_SERVICE_MAP: Record<string, string> = {
      REPLACEMENT: '타이어 교체',
      REPAIR: '타이어 수리',
      BALANCE: '휠 밸런스',
      PUNCTURE: '펑크 수리',
      INSPECTION: '타이어 점검',
    };
    for (const tire of tireInquiries) {
      unified.push({
        id: tire.id,
        type: 'TIRE',
        regionSido: tire.region,
        regionSigungu: tire.subRegion || undefined,
        serviceType: tire.serviceType,
        carModel: tire.carModel || undefined,
        description: tire.description || undefined,
        status: tire.status === 'IN_PROGRESS' ? 'CONNECTED' : tire.status === 'CANCELLED' ? 'COMPLETED' : tire.status,
        createdAt: tire.createdAt.toISOString(),
        shareUrl: '',  // 타이어는 공유 링크 없음
      });
    }

    // 시간순 정렬 (최신순)
    unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 페이지네이션
    const total = unified.length;
    const start = (page - 1) * limit;
    const paged = unified.slice(start, start + limit);

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCount() {
    const [inqCount, svcCount, qrCount, tireCount] = await Promise.all([
      this.prisma.inquiry.count({ where: { isRead: false } }),
      this.prisma.serviceInquiry.count({ where: { status: 'PENDING' } }),
      this.prisma.quoteRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.tireInquiry.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      total: inqCount + svcCount + qrCount + tireCount,
      inquiries: inqCount,
      serviceInquiries: svcCount,
      quoteRequests: qrCount,
      tireInquiries: tireCount,
    };
  }

  async updateStatus(type: string, id: number, status: string) {
    switch (type) {
      case 'GENERAL':
        return this.prisma.inquiry.update({
          where: { id },
          data: {
            isRead: true,
            ...(status === 'COMPLETED' ? { reply: '확인 완료' } : {}),
          },
        });
      case 'SERVICE':
        return this.prisma.serviceInquiry.update({
          where: { id },
          data: {
            status: status as any,
            // 공유 상태로 변경 시 공유 시점 기록 (24시간 만료 기준)
            ...(status === 'SHARED' ? { sharedAt: new Date() } : {}),
          },
        });
      case 'QUOTE':
        return this.prisma.quoteRequest.update({
          where: { id },
          data: { status: status as any },
        });
      case 'TIRE':
        return this.prisma.tireInquiry.update({
          where: { id },
          data: {
            status: status === 'CONNECTED' ? 'IN_PROGRESS' : status === 'PENDING' ? 'PENDING' : 'COMPLETED' as any,
          },
        });
      default:
        throw new Error('Unknown type');
    }
  }

  async delete(type: string, id: number) {
    switch (type) {
      case 'GENERAL':
        return this.prisma.inquiry.delete({ where: { id } });
      case 'SERVICE':
        return this.prisma.serviceInquiry.delete({ where: { id } });
      case 'QUOTE':
        return this.prisma.quoteRequest.delete({ where: { id } });
      case 'TIRE':
        return this.prisma.tireInquiry.delete({ where: { id } });
      default:
        throw new Error('Unknown type');
    }
  }

  async getShareMessage(type: string, id: number): Promise<string> {
    const SERVICE_TYPE_MAP: Record<string, string> = {
      TIRE: '🛞 타이어',
      OIL: '🛢️ 엔진오일',
      BRAKE: '🔴 브레이크',
      MAINTENANCE: '🔧 경정비',
      CONSULT: '💬 종합상담',
    };

    switch (type) {
      case 'SERVICE': {
        const inq = await this.prisma.serviceInquiry.findUnique({
          where: { id },
          include: { customer: { select: { nickname: true, phone: true } } },
        });
        if (!inq) throw new Error('Not found');
        const serviceKo = SERVICE_TYPE_MAP[inq.serviceType] || inq.serviceType;
        let msg = `대표님~ 🙋 고객님 오셨습니다!\n\n`;
        msg += `📍 ${inq.regionSido} ${inq.regionSigungu}\n`;
        msg += `🔧 ${serviceKo}`;
        if (inq.description) msg += ` - ${inq.description}`;
        msg += `\n`;
        if ((inq as any).vehicleNumber || (inq as any).vehicleModel) {
          msg += `🚗 `;
          if ((inq as any).vehicleNumber) msg += (inq as any).vehicleNumber;
          if ((inq as any).vehicleModel) msg += ` (${(inq as any).vehicleModel})`;
          msg += `\n`;
        }
        msg += `\n👇 전화번호 확인하러 가기\n`;
        msg += `https://dreammechaniclab.com/inquiry/service/${inq.id}\n\n`;
        msg += `빠를수록 좋아요! 오늘도 화이팅~ 💪`;
        return msg;
      }
      case 'GENERAL': {
        const inq = await this.prisma.inquiry.findUnique({ where: { id } });
        if (!inq) throw new Error('Not found');
        let msg = `🚨 [긴급] 고객 문의 접수!\n\n`;
        msg += `👤 ${inq.name}\n`;
        if (inq.content) msg += `📝 ${inq.content}\n`;
        msg += `📞 전화번호: 회원만 확인 가능\n`;
        msg += `\n👉 지금 확인하기:\n`;
        msg += `https://dreammechaniclab.com/inquiry/general/${inq.id}\n`;
        msg += `\n⚡ 먼저 전화하는 정비사가 고객을 잡습니다\n`;
        msg += `(카카오 3초 가입 → 바로 전화번호 확인)`;
        return msg;
      }
      case 'QUOTE': {
        const qr = await this.prisma.quoteRequest.findUnique({
          where: { id },
          include: { mechanic: { select: { name: true } } },
        });
        if (!qr) throw new Error('Not found');
        let msg = `🚨 [긴급] 견적 요청 접수!\n\n`;
        msg += `👤 ${qr.customerName}\n`;
        msg += `🚗 ${qr.carModel}\n`;
        if (qr.description) msg += `📝 ${qr.description}\n`;
        msg += `📞 전화번호: 회원만 확인 가능\n`;
        msg += `\n👉 지금 확인하기:\n`;
        msg += `https://dreammechaniclab.com/inquiry/quote/${qr.id}\n`;
        msg += `\n⚡ 먼저 전화하는 정비사가 고객을 잡습니다\n`;
        msg += `(카카오 3초 가입 → 바로 전화번호 확인)`;
        return msg;
      }
      default:
        throw new Error('Unknown type');
    }
  }

  async findOnePublic(type: string, id: number, showPhone: boolean = false) {
    switch (type) {
      case 'SERVICE': {
        const inq = await this.prisma.serviceInquiry.findUnique({
          where: { id },
          include: { customer: { select: { nickname: true, phone: true } } },
        });
        if (!inq) throw new NotFoundException(`문의를 찾을 수 없습니다.`);

        // 24시간 만료 체크 (sharedAt이 있고 24시간 초과 시)
        const EXPIRE_HOURS = 24;
        const sharedAt = (inq as any).sharedAt as Date | null;
        const isExpired = sharedAt
          ? new Date().getTime() - new Date(sharedAt).getTime() > EXPIRE_HOURS * 60 * 60 * 1000
          : false;

        return {
          id: inq.id,
          type: 'SERVICE',
          name: (inq as any).name || inq.customer?.nickname || undefined,
          // 만료된 경우 어드민도 전화번호 블러 처리
          phone: (showPhone && !isExpired) ? (inq.phone || inq.customer?.phone || undefined) : undefined,
          regionSido: inq.regionSido,
          regionSigungu: inq.regionSigungu,
          serviceType: inq.serviceType,
          description: inq.description || undefined,
          vehicleNumber: (inq as any).vehicleNumber || undefined,
          vehicleModel: (inq as any).vehicleModel || undefined,
          status: inq.status,
          createdAt: inq.createdAt.toISOString(),
          sharedAt: sharedAt ? sharedAt.toISOString() : undefined,
          isExpired,
        };
      }
      case 'GENERAL': {
        const inq = await this.prisma.inquiry.findUnique({ where: { id } });
        if (!inq) throw new NotFoundException(`문의를 찾을 수 없습니다.`);
        return {
          id: inq.id,
          type: 'GENERAL',
          name: inq.name,
          phone: showPhone ? inq.phone : undefined,
          description: inq.content,
          businessName: inq.businessName || undefined,
          status: inq.isRead ? (inq.reply ? 'COMPLETED' : 'SHARED') : 'PENDING',
          createdAt: inq.createdAt.toISOString(),
        };
      }
      case 'QUOTE': {
        const qr = await this.prisma.quoteRequest.findUnique({
          where: { id },
          include: { mechanic: { select: { name: true } } },
        });
        if (!qr) throw new NotFoundException(`문의를 찾을 수 없습니다.`);
        return {
          id: qr.id,
          type: 'QUOTE',
          name: qr.customerName,
          phone: showPhone ? qr.customerPhone : undefined,
          carModel: qr.carModel || undefined,
          description: qr.description || undefined,
          mechanicName: qr.mechanic?.name || undefined,
          status: qr.status,
          createdAt: qr.createdAt.toISOString(),
        };
      }
      default:
        throw new NotFoundException(`알 수 없는 문의 타입입니다.`);
    }
  }

  async getOwnerStatus(ownerId: number) {
    return this.prisma.owner.findUnique({
      where: { id: ownerId },
      select: { status: true },
    });
  }

  async getPublicStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await this.prisma.serviceInquiry.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    return { recentCount };
  }
}
