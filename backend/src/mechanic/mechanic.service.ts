import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../common/dto/pagination.dto';

@Injectable()
export class MechanicService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 모든 정비사 조회 (페이지네이션 지원)
  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.mechanic.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mechanic.count({ where: { isActive: true } }),
    ]);

    // Decimal 타입을 숫자로 변환
    const mechanics = data.map((mechanic) => ({
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    }));

    return {
      data: mechanics,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    // Decimal 타입을 숫자로 변환
    return {
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    };
  }

  // 정비사 생성
  async create(createMechanicDto: CreateMechanicDto) {
    const mechanic = await this.prisma.mechanic.create({
      data: {
        ...createMechanicDto,
        galleryImages: createMechanicDto.galleryImages || [],
      },
    });

    // Decimal 타입을 숫자로 변환
    return {
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    };
  }

  // 정비사 수정
  async update(id: number, updateMechanicDto: UpdateMechanicDto) {
    await this.findOne(id);

    const mechanic = await this.prisma.mechanic.update({
      where: { id },
      data: updateMechanicDto,
    });

    // Decimal 타입을 숫자로 변환
    return {
      ...mechanic,
      mapLat: Number(mechanic.mapLat),
      mapLng: Number(mechanic.mapLng),
    };
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

    return await this.prisma.$transaction(async (tx) => {
      // 트랜잭션 내부에서 중복 체크 (Race Condition 방지)
      const isDuplicate = await this.cacheService.checkDuplicateClick(
        id,
        ipAddress,
      );
      if (isDuplicate) {
        throw new BadRequestException(
          'Duplicate click detected. Please wait 10 seconds.',
        );
      }

      // 캐시에 클릭 기록 (중복 방지용) - 체크 직후 즉시 기록
      await this.cacheService.recordClick(id, ipAddress);

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

      // 업데이트된 정비사 정보 반환
      const mechanic = await tx.mechanic.findUnique({
        where: { id },
      });

      if (!mechanic) {
        throw new NotFoundException(`Mechanic with ID ${id} not found`);
      }

      // Decimal 타입을 숫자로 변환
      return {
        ...mechanic,
        mapLat: Number(mechanic.mapLat),
        mapLng: Number(mechanic.mapLng),
      };
    });
  }
}
