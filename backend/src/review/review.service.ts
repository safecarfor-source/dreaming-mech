import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './schemas/review.schema';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * 리뷰 작성 (승인 대기)
   */
  async create(dto: CreateReviewDto) {
    // 정비소 존재 여부 확인
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id: dto.mechanicId },
    });

    if (!mechanic) {
      throw new NotFoundException(`정비소를 찾을 수 없습니다 (ID: ${dto.mechanicId})`);
    }

    return this.prisma.review.create({
      data: {
        mechanicId: dto.mechanicId,
        nickname: dto.nickname,
        content: dto.content,
        rating: dto.rating,
        isApproved: false, // 관리자 승인 필요
      },
    });
  }

  /**
   * 정비소별 승인된 리뷰 조회 (공개)
   */
  async findByMechanic(mechanicId: number) {
    return this.prisma.review.findMany({
      where: {
        mechanicId,
        isApproved: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        nickname: true,
        content: true,
        rating: true,
        createdAt: true,
      },
    });
  }

  /**
   * 전체 리뷰 목록 (관리자)
   */
  async findAll(params?: { page?: number; limit?: number; approved?: boolean }) {
    const { page = 1, limit = 20, approved } = params || {};
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (approved !== undefined) {
      where.isApproved = approved;
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          mechanic: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
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
   * 리뷰 승인
   */
  async approve(id: number) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  /**
   * 리뷰 반려 (비활성화)
   */
  async reject(id: number) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    return this.prisma.review.update({
      where: { id },
      data: { isApproved: false, isActive: false },
    });
  }

  /**
   * 리뷰 삭제
   */
  async remove(id: number) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    return this.prisma.review.delete({ where: { id } });
  }

  /**
   * 미승인 리뷰 수
   */
  async getPendingCount() {
    return this.prisma.review.count({
      where: { isApproved: false, isActive: true },
    });
  }
}
