import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTireInquiryDto } from './schemas/tire-inquiry.schema';

@Injectable()
export class TireInquiryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTireInquiryDto) {
    return this.prisma.tireInquiry.create({ data: dto });
  }

  async findAll(params: { page?: number; limit?: number; status?: string; region?: string }) {
    const { page = 1, limit = 20, status, region } = params;
    const where: any = {};
    if (status) where.status = status;
    if (region) where.region = { contains: region };

    const [data, total] = await Promise.all([
      this.prisma.tireInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tireInquiry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    return this.prisma.tireInquiry.findUnique({ where: { id } });
  }

  async updateStatus(id: number, status: string, adminNote?: string) {
    return this.prisma.tireInquiry.update({
      where: { id },
      data: { status: status as any, ...(adminNote !== undefined && { adminNote }) },
    });
  }

  async getUnreadCount() {
    return this.prisma.tireInquiry.count({ where: { status: 'PENDING' } });
  }

  async delete(id: number) {
    return this.prisma.tireInquiry.delete({ where: { id } });
  }
}
