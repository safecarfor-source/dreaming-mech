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
        phone: dto.phone,
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

    // 5. 해당 지역 정비사 알림톡 발송 (비동기, 실패해도 문의는 성공)
    this.sendInquiryAlimtalkToLocalMechanics(inquiry).catch((error) => {
      this.logger.error('정비사 알림톡 발송 실패 (문의는 접수됨):', error);
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

  private async sendInquiryAlimtalkToLocalMechanics(inquiry: any) {
    // 해당 지역(regionSigungu)의 활성 정비소 찾기
    // Mechanic.location이 regionSigungu를 포함하는 경우 매칭
    const mechanics = await this.prisma.mechanic.findMany({
      where: {
        isActive: true,
        OR: [
          { location: { contains: inquiry.regionSigungu } },
          { location: { contains: inquiry.regionSido } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    // APPROVED된 사장님이 있는 정비소, 또는 phone이 있는 정비소만 필터
    const targetMechanics = mechanics.filter(
      (m) =>
        m.phone && // 정비소 전화번호 있음
        (m.owner?.status === 'APPROVED' || !m.ownerId), // 승인된 사장님 OR 독립 정비소
    );

    if (targetMechanics.length === 0) {
      this.logger.log(
        `알림 대상 정비사 없음 - ${inquiry.regionSido} ${inquiry.regionSigungu}`,
      );
      return;
    }

    this.logger.log(
      `${inquiry.regionSido} ${inquiry.regionSigungu} 정비사 ${targetMechanics.length}곳에 알림톡 발송 시작`,
    );

    // 각 정비소에 알림톡 발송 (병렬)
    const results = await Promise.allSettled(
      targetMechanics.map((mechanic) =>
        this.notificationService.sendServiceInquiryAlimtalk({
          mechanicPhone: mechanic.phone,
          mechanicName: mechanic.name,
          regionSido: inquiry.regionSido,
          regionSigungu: inquiry.regionSigungu,
          serviceType: inquiry.serviceType,
          description: inquiry.description,
          inquiryId: inquiry.id,
        }),
      ),
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    this.logger.log(
      `알림톡 발송 완료: ${successCount}/${targetMechanics.length}건 성공`,
    );
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

  async getOwnerStatus(ownerId: number) {
    return this.prisma.owner.findUnique({
      where: { id: ownerId },
      select: { status: true },
    });
  }
}
