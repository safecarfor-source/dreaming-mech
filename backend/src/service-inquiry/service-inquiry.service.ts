import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateServiceInquiryDto } from './dto/create-service-inquiry.dto';
import { ServiceInquiryStatus } from '@prisma/client';

@Injectable()
export class ServiceInquiryService {
  private readonly logger = new Logger(ServiceInquiryService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // 서비스 타입 한국어 매핑
  private getServiceTypeKorean(serviceType: string): string {
    const map: Record<string, string> = {
      TIRE: '🛞 타이어',
      OIL: '🛢️ 엔진오일',
      BRAKE: '🔴 브레이크',
      MAINTENANCE: '🔧 경정비',
      CONSULT: '💬 종합상담',
    };
    return map[serviceType] || serviceType;
  }

  async create(dto: CreateServiceInquiryDto, customerId: number) {
    // 1. Customer phone 업데이트
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { phone: dto.phone },
    });

    // 2. 환경변수에서 카카오 오픈채팅 URL 가져오기
    const kakaoOpenChatUrl = process.env.KAKAO_OPENCHAT_URL || null;

    // 3. ServiceInquiry 생성
    const inquiry = await this.prisma.serviceInquiry.create({
      data: {
        customerId,
        regionSido: dto.regionSido,
        regionSigungu: dto.regionSigungu,
        serviceType: dto.serviceType,
        description: dto.description,
        kakaoOpenChatUrl,
      },
      include: {
        customer: true,
      },
    });

    // 4. 텔레그램 알림 발송 (비동기, 실패해도 문의는 성공)
    this.sendTelegramNotification(inquiry).catch((error) => {
      this.logger.error('텔레그램 알림 발송 실패 (문의는 접수됨):', error);
    });

    return inquiry;
  }

  private async sendTelegramNotification(inquiry: any) {
    const serviceTypeKo = this.getServiceTypeKorean(inquiry.serviceType);
    let message = `🔔 <b>새 정비 문의</b>\n`;
    message += `📍 지역: ${inquiry.regionSido} ${inquiry.regionSigungu}\n`;
    message += `🔧 항목: ${serviceTypeKo}\n`;
    if (inquiry.description) {
      message += `📝 ${inquiry.description}\n`;
    }
    message += `👉 https://dreammechaniclab.com/admin/inquiries/${inquiry.id}`;

    const sent = await this.notificationService.sendTelegramMessage(message);

    // 텔레그램 발송 여부 업데이트
    if (sent) {
      await this.prisma.serviceInquiry.update({
        where: { id: inquiry.id },
        data: {
          telegramSent: true,
          telegramSentAt: new Date(),
        },
      });
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.serviceInquiry.findMany({
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              nickname: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceInquiry.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const inquiry = await this.prisma.serviceInquiry.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`문의 #${id}를 찾을 수 없습니다.`);
    }

    return inquiry;
  }

  async findOnePublic(id: number) {
    const inquiry = await this.prisma.serviceInquiry.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            nickname: true,
            // phone 제외 (공개 조회에서는 전화번호 블러)
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`문의 #${id}를 찾을 수 없습니다.`);
    }

    return inquiry;
  }

  async updateStatus(id: number, status: ServiceInquiryStatus) {
    const inquiry = await this.prisma.serviceInquiry.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
      },
    });

    return inquiry;
  }

  async getShareMessage(id: number): Promise<string> {
    const inquiry = await this.findOne(id);
    const serviceTypeKo = this.getServiceTypeKorean(inquiry.serviceType);

    let message = `🔔 고객 문의 도착!\n`;
    message += `📍 ${inquiry.regionSido} ${inquiry.regionSigungu}\n`;
    message += `🔧 ${serviceTypeKo}\n`;
    if (inquiry.description) {
      message += `📝 ${inquiry.description}\n`;
    }
    message += `\n👉 고객 연락처 확인:\n`;
    message += `https://dreammechaniclab.com/inquiry/${inquiry.id}\n`;
    message += `(회원 정비사만 전화번호 확인 가능)`;

    return message;
  }
}
