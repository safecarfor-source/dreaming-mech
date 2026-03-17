import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GdService {
  constructor(private prisma: PrismaService) {}

  // 차량/고객 검색 (차량번호, 고객명, 전화번호 통합 검색)
  async searchVehicles(q: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = q ? {
      OR: [
        { plateNumber: { contains: q, mode: 'insensitive' as const } },
        { ownerName: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
        { carModel: { contains: q, mode: 'insensitive' as const } },
        { code: { contains: q } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.gdVehicle.findMany({
        where,
        orderBy: { ownerName: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          plateNumber: true,
          ownerName: true,
          phone: true,
          carModel: true,
          color: true,
          displacement: true,
          modelYear: true,
        },
      }),
      this.prisma.gdVehicle.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // 특정 차량의 정비 이력 (날짜 역순, 무한스크롤)
  async getVehicleRepairs(code: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const vehicle = await this.prisma.gdVehicle.findUnique({
      where: { code },
      select: {
        code: true,
        plateNumber: true,
        ownerName: true,
        phone: true,
        carModel: true,
        color: true,
        modelYear: true,
      },
    });

    if (!vehicle) return { vehicle: null, repairs: [], total: 0 };

    const [repairs, total] = await Promise.all([
      this.prisma.gdRepair.findMany({
        where: { vehicleCode: code },
        orderBy: { repairDate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          repairDate: true,
          productName: true,
          qty: true,
          amount: true,
          mileage: true,
          unit: true,
        },
      }),
      this.prisma.gdRepair.count({ where: { vehicleCode: code } }),
    ]);

    return { vehicle, repairs, total, page, limit };
  }

  // 타이어 사이즈 숫자를 표준 형식으로 변환
  // "2355519" → "235/55R19", "2454518" → "245/45R18"
  private parseTireSize(q: string): string | null {
    const digits = q.replace(/\D/g, '');
    if (digits.length === 7) {
      // 2355519 → 235/55R19
      return `${digits.slice(0, 3)}/${digits.slice(3, 5)}R${digits.slice(5, 7)}`;
    }
    if (digits.length === 6) {
      // 195615 → 195/6?R15 (드문 패턴)
      return null;
    }
    return null;
  }

  // 상품/타이어 검색
  async searchProducts(q: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 타이어 사이즈 숫자 검색 지원 (2355519 → 235/55R19)
    const tireSize = this.parseTireSize(q);
    const searchTerms: { OR: any[] } = { OR: [] };

    if (q) {
      searchTerms.OR.push(
        { name: { contains: q, mode: 'insensitive' as const } },
        { code: { contains: q, mode: 'insensitive' as const } },
        { altName: { contains: q, mode: 'insensitive' as const } },
      );
    }

    if (tireSize) {
      searchTerms.OR.push(
        { name: { contains: tireSize, mode: 'insensitive' as const } },
      );
    }

    const where = searchTerms.OR.length > 0 ? searchTerms : {};

    const [data, total] = await Promise.all([
      this.prisma.gdProduct.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.gdProduct.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // 거래처 검색
  async searchCustomers(q: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { code: { contains: q } },
        { phone: { contains: q } },
        { bizNumber: { contains: q } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.gdCustomer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.gdCustomer.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
