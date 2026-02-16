import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateQuoteRequestDto, UpdateQuoteRequestStatusDto } from './schemas/quote-request.schema';

@Injectable()
export class QuoteRequestService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * 견적 요청 생성 + 알림톡 발송
   */
  async create(dto: CreateQuoteRequestDto) {
    // 정비소 존재 여부 확인
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: dto.mechanicId },
      select: { id: true, name: true, phone: true },
    });

    if (!mechanic) {
      throw new NotFoundException(`정비소를 찾을 수 없습니다 (ID: ${dto.mechanicId})`);
    }

    // 견적 요청 생성
    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        mechanicId: dto.mechanicId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        carModel: dto.carModel,
        carYear: dto.carYear,
        description: dto.description,
        images: dto.images || [],
      },
    });

    // 알림톡 발송 (비동기 - 실패해도 견적 요청은 저장됨)
    try {
      const sent = await this.notificationService.sendQuoteRequestAlimtalk({
        mechanicPhone: mechanic.phone,
        mechanicName: mechanic.name,
        customerName: dto.customerName,
        carModel: dto.carModel,
        description: dto.description,
        quoteRequestId: quoteRequest.id,
      });

      if (sent) {
        await this.prisma.quoteRequest.update({
          where: { id: quoteRequest.id },
          data: {
            alimtalkSent: true,
            alimtalkSentAt: new Date(),
          },
        });
      }
    } catch (error) {
      // 알림톡 실패는 무시 (견적 요청은 이미 저장됨)
      console.error('알림톡 발송 중 오류:', error);
    }

    return quoteRequest;
  }

  /**
   * 전체 견적 요청 목록 (관리자)
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where,
        include: {
          mechanic: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 정비소별 견적 요청 목록 (사장님)
   */
  async findByMechanic(mechanicId: number, params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where: { mechanicId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quoteRequest.count({ where: { mechanicId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 견적 요청 상세
   */
  async findOne(id: number) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        mechanic: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    if (!quoteRequest) {
      throw new NotFoundException(`견적 요청을 찾을 수 없습니다 (ID: ${id})`);
    }

    return quoteRequest;
  }

  /**
   * 견적 요청 상태 변경
   */
  async updateStatus(id: number, dto: UpdateQuoteRequestStatusDto) {
    await this.findOne(id);

    return this.prisma.quoteRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /**
   * 미확인 견적 요청 수
   */
  async getUnreadCount(mechanicId?: number) {
    const where: any = { status: 'PENDING' };
    if (mechanicId) {
      where.mechanicId = mechanicId;
    }

    return this.prisma.quoteRequest.count({ where });
  }
}
