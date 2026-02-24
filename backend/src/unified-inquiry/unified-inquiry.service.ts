import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UnifiedInquiry {
  id: number;
  type: 'GENERAL' | 'SERVICE' | 'QUOTE';
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
}

@Injectable()
export class UnifiedInquiryService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20) {
    // 3개 테이블에서 병렬 조회
    const [inquiries, serviceInquiries, quoteRequests] = await Promise.all([
      this.prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceInquiry.findMany({
        include: {
          customer: {
            select: { id: true, nickname: true, phone: true },
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
    const [inqCount, svcCount, qrCount] = await Promise.all([
      this.prisma.inquiry.count({ where: { isRead: false } }),
      this.prisma.serviceInquiry.count({ where: { status: 'PENDING' } }),
      this.prisma.quoteRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      total: inqCount + svcCount + qrCount,
      inquiries: inqCount,
      serviceInquiries: svcCount,
      quoteRequests: qrCount,
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
          data: { status: status as any },
        });
      case 'QUOTE':
        return this.prisma.quoteRequest.update({
          where: { id },
          data: { status: status as any },
        });
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
        let msg = `🔔 고객 문의 도착!\n`;
        msg += `📍 ${inq.regionSido} ${inq.regionSigungu}\n`;
        msg += `🔧 ${serviceKo}\n`;
        if ((inq as any).name) msg += `👤 ${(inq as any).name}\n`;
        if (inq.description) msg += `📝 ${inq.description}\n`;
        msg += `\n👉 고객 연락처 확인:\n`;
        msg += `https://dreammechaniclab.com/inquiry/service/${inq.id}\n`;
        msg += `(회원 정비사만 전화번호 확인 가능)`;
        return msg;
      }
      case 'GENERAL': {
        const inq = await this.prisma.inquiry.findUnique({ where: { id } });
        if (!inq) throw new Error('Not found');
        let msg = `🔔 고객 문의 도착!\n`;
        msg += `👤 ${inq.name}\n`;
        if (inq.content) msg += `📝 ${inq.content}\n`;
        msg += `\n👉 상세 확인:\n`;
        msg += `https://dreammechaniclab.com/inquiry/general/${inq.id}\n`;
        msg += `(회원 정비사만 전화번호 확인 가능)`;
        return msg;
      }
      case 'QUOTE': {
        const qr = await this.prisma.quoteRequest.findUnique({
          where: { id },
          include: { mechanic: { select: { name: true } } },
        });
        if (!qr) throw new Error('Not found');
        let msg = `🔔 견적 요청 도착!\n`;
        msg += `👤 ${qr.customerName}\n`;
        msg += `🚗 ${qr.carModel}\n`;
        if (qr.description) msg += `📝 ${qr.description}\n`;
        msg += `\n👉 상세 확인:\n`;
        msg += `https://dreammechaniclab.com/inquiry/quote/${qr.id}\n`;
        msg += `(회원 정비사만 전화번호 확인 가능)`;
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
        return {
          id: inq.id,
          type: 'SERVICE',
          name: (inq as any).name || inq.customer?.nickname || undefined,
          phone: showPhone ? (inq.phone || inq.customer?.phone || undefined) : undefined,
          regionSido: inq.regionSido,
          regionSigungu: inq.regionSigungu,
          serviceType: inq.serviceType,
          description: inq.description || undefined,
          status: inq.status,
          createdAt: inq.createdAt.toISOString(),
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
}
