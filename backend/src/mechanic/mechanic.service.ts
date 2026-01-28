import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

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
  async incrementClick(
    id: number,
    ipAddress: string,
    userAgent: string,
    isBot: boolean,
  ) {
    await this.findOne(id);

    // 중복 클릭 체크 (10초 이내)
    const isDuplicate = await this.cacheService.checkDuplicateClick(
      id,
      ipAddress,
    );
    if (isDuplicate) {
      throw new BadRequestException(
        'Duplicate click detected. Please wait 10 seconds.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 봇이 아닌 경우에만 clickCount 증가
      if (!isBot) {
        await tx.mechanic.update({
          where: { id },
          data: {
            clickCount: { increment: 1 },
          },
        });
      }

      // ClickLog 기록 (봇 여부와 관계없이 기록)
      await tx.clickLog.create({
        data: {
          mechanicId: id,
          ipAddress,
          userAgent,
          isBot,
        },
      });

      // 캐시에 클릭 기록 (중복 방지용)
      await this.cacheService.recordClick(id, ipAddress);

      // 업데이트된 정비사 정보 반환
      const mechanic = await tx.mechanic.findUnique({
        where: { id },
      });

      return mechanic;
    });
  }
}
