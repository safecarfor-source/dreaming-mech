import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryType } from '@prisma/client';

@Injectable()
export class InquiryService {
  constructor(private prisma: PrismaService) {}

  // 문의 등록 (공개 API)
  async create(data: {
    type: InquiryType;
    name: string;
    phone: string;
    businessName?: string;
    content: string;
  }) {
    return this.prisma.inquiry.create({ data });
  }

  // 문의 목록 조회 (관리자용)
  async findAll(params: {
    type?: InquiryType;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { type, isRead, page = 1, limit = 20 } = params;
    const where: any = {};
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [data, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inquiry.count({ where }),
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

  // 문의 상세 조회 (관리자용)
  async findOne(id: number) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    return inquiry;
  }

  // 읽음 처리
  async markAsRead(id: number) {
    return this.prisma.inquiry.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 답변 작성 (관리자용)
  async reply(id: number, reply: string) {
    return this.prisma.inquiry.update({
      where: { id },
      data: { reply, repliedAt: new Date(), isRead: true },
    });
  }

  // 안읽은 문의 수
  async getUnreadCount() {
    const [customer, mechanic] = await Promise.all([
      this.prisma.inquiry.count({
        where: { type: 'CUSTOMER', isRead: false },
      }),
      this.prisma.inquiry.count({
        where: { type: 'MECHANIC', isRead: false },
      }),
    ]);
    return { customer, mechanic, total: customer + mechanic };
  }

  // 문의 삭제 (관리자용)
  async remove(id: number) {
    return this.prisma.inquiry.delete({ where: { id } });
  }
}
