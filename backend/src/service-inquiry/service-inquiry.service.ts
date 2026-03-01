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

  async create(dto: CreateServiceInquiryDto) {
    // 1. 환경변수에서 카카오 오픈채팅 URL 가져오기
    const kakaoOpenChatUrl = process.env.KAKAO_OPENCHAT_URL || null;

    // 2. ServiceInquiry 생성 (비로그인 접수, customerId 없음)
    const inquiry = await this.prisma.serviceInquiry.create({
      data: {
        name: dto.name,
        regionSido: dto.regionSido,
        regionSigungu: dto.regionSigungu,
        ...(dto.regionDong && { regionDong: dto.regionDong }),
        serviceType: dto.serviceType,
        description: dto.description,
        phone: dto.phone,
        vehicleNumber: dto.vehicleNumber,
        vehicleModel: dto.vehicleModel,
        kakaoOpenChatUrl,
        // 추적 코드가 있으면 TrackingLink와 연결
        ...(dto.trackingCode && { trackingCode: dto.trackingCode }),
        // 선택된 정비소가 있으면 연결
        ...(dto.mechanicId && { mechanicId: dto.mechanicId }),
      },
      include: {
        mechanic: {
          select: { id: true, name: true, address: true, phone: true },
        },
      },
    });

    // 3. 텔레그램 알림 발송 (비동기, 실패해도 문의는 성공)
    this.sendTelegramNotification(inquiry).catch((error) => {
      this.logger.error('텔레그램 알림 발송 실패 (문의는 접수됨):', error);
    });

    // 4. 해당 지역 정비사 알림톡 발송 (비동기, 실패해도 문의는 성공)
    this.sendInquiryAlimtalkToLocalMechanics(inquiry).catch((error) => {
      this.logger.error('정비사 알림톡 발송 실패 (문의는 접수됨):', error);
    });

    return inquiry;
  }

  private async sendTelegramNotification(inquiry: any) {
    const serviceTypeKo = this.getServiceTypeKorean(inquiry.serviceType);
    let message = `🔔 <b>새 정비 문의</b>\n`;
    const dong = (inquiry as any).regionDong;
    message += `📍 지역: ${inquiry.regionSido} ${inquiry.regionSigungu}${dong ? ` ${dong}` : ''}\n`;
    message += `🔧 항목: ${serviceTypeKo}\n`;
    if (inquiry.name) {
      message += `👤 고객: ${inquiry.name}\n`;
    }
    if (inquiry.vehicleNumber || inquiry.vehicleModel) {
      message += `🚗 차량: `;
      if (inquiry.vehicleNumber) message += inquiry.vehicleNumber;
      if (inquiry.vehicleModel) message += ` (${inquiry.vehicleModel})`;
      message += `\n`;
    }
    if (inquiry.description) {
      message += `📝 ${inquiry.description}\n`;
    }
    // 선택된 정비소 정보 표시
    if (inquiry.mechanic) {
      message += `🏪 선택 정비소: ${inquiry.mechanic.name}\n`;
      message += `📮 주소: ${inquiry.mechanic.address}\n`;
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
    // 정비소가 직접 선택된 경우: 해당 정비소 하나에만 알림톡 발송
    if (inquiry.mechanicId) {
      const selectedMechanic = await this.prisma.mechanic.findUnique({
        where: { id: inquiry.mechanicId },
        include: {
          owner: {
            select: { id: true, phone: true, status: true },
          },
        },
      });

      if (!selectedMechanic || !selectedMechanic.phone) {
        this.logger.log(`선택 정비소(#${inquiry.mechanicId}) 전화번호 없음 — 알림톡 스킵`);
        return;
      }

      // ownerId가 있으면 APPROVED 사장님만, 없으면 독립 정비소로 취급
      if (selectedMechanic.ownerId && selectedMechanic.owner?.status !== 'APPROVED') {
        this.logger.log(`선택 정비소(#${inquiry.mechanicId}) 사장님 미승인 — 알림톡 스킵`);
        return;
      }

      await this.notificationService.sendServiceInquiryAlimtalk({
        mechanicPhone: selectedMechanic.phone,
        mechanicName: selectedMechanic.name,
        regionSido: inquiry.regionSido,
        regionSigungu: inquiry.regionSigungu,
        serviceType: inquiry.serviceType,
        description: inquiry.description,
        inquiryId: inquiry.id,
      });

      this.logger.log(`선택 정비소(${selectedMechanic.name})에 알림톡 발송 완료`);
      return;
    }

    // 정비소가 선택되지 않은 경우: 지역 자동 매칭
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
      data: items,
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

    let message = `대표님~ 🙋 고객님 오셨습니다!\n\n`;
    const regionDong = (inquiry as any).regionDong;
    message += `📍 ${inquiry.regionSido} ${inquiry.regionSigungu}${regionDong ? ` ${regionDong}` : ''}\n`;
    message += `🔧 ${serviceTypeKo}`;
    if ((inquiry as any).vehicleNumber || (inquiry as any).vehicleModel) {
      message += ` (`;
      if ((inquiry as any).vehicleNumber) message += (inquiry as any).vehicleNumber;
      if ((inquiry as any).vehicleNumber && (inquiry as any).vehicleModel) message += ` / `;
      if ((inquiry as any).vehicleModel) message += (inquiry as any).vehicleModel;
      message += `)`;
    }
    message += `\n`;
    if (inquiry.description) {
      message += `💬 "${inquiry.description}"\n`;
    }
    message += `\n👇 아래 링크에서 전화번호 확인하세요!\n`;
    message += `https://dreammechaniclab.com/inquiry/${inquiry.id}\n\n`;
    message += `오늘도 화이팅입니다~ 💪`;

    return message;
  }

  async getOwnerStatus(ownerId: number) {
    return this.prisma.owner.findUnique({
      where: { id: ownerId },
      select: { status: true },
    });
  }

  async incrementShareClick(id: number) {
    try {
      await this.prisma.serviceInquiry.update({
        where: { id },
        data: { shareClickCount: { increment: 1 } },
      });
    } catch {
      // 무시
    }
  }
}
