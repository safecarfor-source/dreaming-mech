import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(private prisma: PrismaService) {}

  // 모든 정비사 조회
  async findAll() {
    return await this.prisma.mechanic.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 특정 정비사 조회
  async findOne(id: number) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id },
      include: {
        clickLogs: {
          orderBy: { clickedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!mechanic) {
      throw new NotFoundException(`Mechanic with ID ${id} not found`);
    }

    return mechanic;
  }

  // 정비사 생성
  async create(createMechanicDto: CreateMechanicDto) {
    return await this.prisma.mechanic.create({
      data: {
        ...createMechanicDto,
        galleryImages: createMechanicDto.galleryImages || [],
      },
    });
  }

  // 정비사 수정
  async update(id: number, updateMechanicDto: UpdateMechanicDto) {
    await this.findOne(id);

    return await this.prisma.mechanic.update({
      where: { id },
      data: updateMechanicDto,
    });
  }

  // 정비사 삭제 (소프트 삭제)
  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.mechanic.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // 클릭수 증가
  async incrementClick(id: number, ipAddress?: string) {
    await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      const mechanic = await tx.mechanic.update({
        where: { id },
        data: {
          clickCount: { increment: 1 },
        },
      });

      await tx.clickLog.create({
        data: {
          mechanicId: id,
          ipAddress: ipAddress || 'unknown',
        },
      });

      return mechanic;
    });
  }
}
