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
  async findAll(paginationDto?: PaginationDto & { search?: string; location?: string; specialty?: string; sido?: string; sigungu?: string; includeInactive?: boolean }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, location, specialty, sido, sigungu, includeInactive } = paginationDto || {};
    const skip = (page - 1) * limit;

    // 검색/필터 조건 구성
    // includeInactive가 true이면 isActive 필터 미적용 (관리자 전용)
    const where: any = includeInactive ? {} : { isActive: true };

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
    // 정식명↔약칭 매핑으로 "충청남도"↔"충남", "인천광역시"↔"인천" 등 모두 매칭
    if (sido || sigungu) {
      const SIDO_ALIAS: Record<string, string> = {
        '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
        '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
        '울산광역시': '울산', '세종특별자치시': '세종',
        '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
        '충청북도': '충북', '충청남도': '충남',
        '전라북도': '전북', '전북특별자치도': '전북',
        '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
        '제주특별자치도': '제주',
      };
      // 시군구 약칭 매핑 (일산→고양시, 분당→성남시 등)
      const SIGUNGU_ALIASES: Record<string, string[]> = {
        '고양시': ['고양', '일산', '일산서구', '일산동구', '덕양구'],
        '성남시': ['성남', '분당', '판교', '수정구', '중원구'],
        '용인시': ['용인', '수지', '기흥', '처인구'],
        '수원시': ['수원', '영통', '권선', '장안구', '팔달구'],
        '화성시': ['화성', '동탄'],
        '안양시': ['안양', '평촌', '만안구', '동안구'],
        '안산시': ['안산', '단원구', '상록구'],
        '남양주시': ['남양주', '별내', '다산'],
        '파주시': ['파주', '운정'],
        '의정부시': ['의정부'],
        '부천시': ['부천'],
        '시흥시': ['시흥'],
        '평택시': ['평택'],
        '창원시': ['창원', '마산', '진해'],
        '천안시': ['천안', '쌍용', '불당'],
        '청주시': ['청주'],
        '전주시': ['전주'],
      };
      const regionConditions: any[] = [];
      if (sigungu) {
        regionConditions.push({ location: { contains: sigungu, mode: 'insensitive' } });
        // 시군구 약칭으로도 검색 (고양시 → 일산, 고양 등)
        const aliases = SIGUNGU_ALIASES[sigungu];
        if (aliases) {
          for (const alias of aliases) {
            regionConditions.push({ location: { contains: alias, mode: 'insensitive' } });
          }
        }
      }
      if (sido) {
        regionConditions.push({ location: { contains: sido, mode: 'insensitive' } });
        const alias = SIDO_ALIAS[sido];
        if (alias) {
          regionConditions.push({ location: { contains: alias, mode: 'insensitive' } });
        }
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
          user: {
            select: {
              id: true,
              nickname: true,
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
        user: {
          select: {
            id: true,
            nickname: true,
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

    // ownerId → userId 매핑 (프론트에서 ownerId로 보냄, Prisma 스키마는 userId)
    const rawData = createMechanicDto as Record<string, any>;
    const ownerIdValue = rawData.ownerId;
    delete rawData.ownerId;

    const createData: any = {
      ...rawData,
      ...(ownerIdValue != null ? { userId: ownerIdValue } : {}),
      galleryImages: createMechanicDto.galleryImages || [],
      operatingHours: toJsonField(createMechanicDto.operatingHours),
      specialties: createMechanicDto.specialties || [],
      paymentMethods: createMechanicDto.paymentMethods || [],
      holidays: toJsonField(createMechanicDto.holidays),
      sortOrder: nextOrder,
    };

    const mechanic = await this.prisma.mechanic.create({
      data: createData,
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

    // ownerId → userId 매핑 (프론트에서 ownerId로 보냄, Prisma 스키마는 userId)
    const data: any = { ...updateMechanicDto };
    if ('ownerId' in data) {
      const ownerIdValue = data.ownerId;
      delete data.ownerId;
      if (ownerIdValue !== undefined) {
        data.userId = ownerIdValue;
      }
    }
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

  // 전화번호 공개 기록
  async recordPhoneReveal(
    id: number,
    ipAddress: string,
    userAgent: string,
    isBot: boolean,
  ) {
    await this.findOne(id);

    // IP 익명화: 마지막 옥텟을 0으로 대체 (예: 1.2.3.4 → 1.2.3.0)
    const anonymizedIp = ipAddress.replace(/\.\d+$/, '.0');

    return await this.prisma.$transaction(async (tx) => {
      // 24시간 내 동일 IP 중복 체크
      const isDuplicate = await this.cacheService.checkDuplicatePhoneReveal(
        id,
        anonymizedIp,
      );
      if (isDuplicate) {
        return { recorded: false };
      }

      // 캐시에 기록 (24시간 TTL)
      await this.cacheService.recordPhoneReveal(id, anonymizedIp);

      // 봇이 아닌 경우에만 phoneRevealCount 증가
      if (!isBot) {
        await tx.mechanic.update({
          where: { id },
          data: {
            phoneRevealCount: { increment: 1 },
          },
        });
      }

      // PhoneRevealLog 기록 (봇 여부와 관계없이 기록)
      await tx.phoneRevealLog.create({
        data: {
          mechanicId: id,
          ipAddress: anonymizedIp,
          userAgent,
          isBot,
          revealedAt: new Date(),
        },
      });

      return { recorded: true };
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
