import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../common/dto/pagination.dto';

/**
 * null 값을 Prisma.JsonNull로 변환 (Json? 필드용)
 */
function toJsonField(value: any): any {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return undefined;
  return value;
}

@Injectable()
export class MechanicService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 모든 정비사 조회 (페이지네이션 + 검색/필터링 지원)
  async findAll(paginationDto?: PaginationDto & { search?: string; location?: string; specialty?: string; sido?: string; sigungu?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, location, specialty, sido, sigungu } = paginationDto || {};
    const skip = (page - 1) * limit;

    // 검색/필터 조건 구성
    const where: any = { isActive: true };

    // 검색어: 이름 또는 주소에 포함된 키워드
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 지역 필터 (기존 단순 키워드 방식)
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // sido/sigungu 필터 (정비소 선택 시 지역 기반 조회용)
    // sido와 sigungu 중 하나라도 있으면 OR 조건으로 매칭
    if (sido || sigungu) {
      const regionConditions: any[] = [];
      if (sigungu) {
        regionConditions.push({ location: { contains: sigungu, mode: 'insensitive' } });
      }
      if (sido) {
        regionConditions.push({ location: { contains: sido, mode: 'insensitive' } });
      }
      where.OR = regionConditions;
    }

    // 전문 분야 필터 (JSON array contains)
    if (specialty) {
      where.specialties = {
        array_contains: specialty,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.mechanic.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              businessName: true,
            },
          },
        },
      }),
      this.prisma.mechanic.count({ where }),
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
        reviews: {
          where: { isApproved: true, isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            nickname: true,
            content: true,
            rating: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
          },
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
    // 새 정비소는 목록 맨 끝에 배치
    const maxOrder = await this.prisma.mechanic.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    const mechanic = await this.prisma.mechanic.create({
      data: {
        ...createMechanicDto,
        galleryImages: createMechanicDto.galleryImages || [],
        operatingHours: toJsonField(createMechanicDto.operatingHours),
        specialties: createMechanicDto.specialties || [],
        paymentMethods: createMechanicDto.paymentMethods || [],
        holidays: toJsonField(createMechanicDto.holidays),
        sortOrder: nextOrder,
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

    // Json? 필드의 null 처리
    const data: any = { ...updateMechanicDto };
    if ('operatingHours' in data) data.operatingHours = toJsonField(data.operatingHours);
    if ('holidays' in data) data.holidays = toJsonField(data.holidays);

    const mechanic = await this.prisma.mechanic.update({
      where: { id },
      data,
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
          'Duplicate click detected. Please wait 60 seconds.',
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

  // 정비사 순서 변경
  async reorder(orderedIds: number[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.mechanic.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
    return { message: '순서가 변경되었습니다.' };
  }
}
