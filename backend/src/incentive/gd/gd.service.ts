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
        orderBy: [
          { stock: 'desc' },  // 재고 있는 것 우선
          { code: 'asc' },    // 극동 코드 순서 (TH=한국, TM=미쉘린 등)
        ],
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

  // 시재관리 (현금 출납부)
  // - 현금입금: productCode=]000000000001 (현금수금), amount는 음수 → ABS가 입금액
  // - 현금출금: IO=1 데이터 미동기화 상태이므로 1단계에서는 0으로 표시
  async getCashLedger(startDate: string, endDate: string) {
    // 이월시재: startDate 이전 현금수금 누계 (모두 음수이므로 SUM의 절대값)
    const carryOverResult = await this.prisma.gdSaleDetail.aggregate({
      where: {
        productCode: ']000000000001',
        saleDate: { lt: startDate },
      },
      _sum: { amount: true },
    });
    // amount가 음수이므로 ABS = 이월시재 (음수 합계를 양수로 전환)
    const carryOver = Math.abs(carryOverResult._sum.amount ?? 0);

    // 기간 내 현금수금 항목 전체 조회 (거래처명 JOIN)
    const rawEntries = await this.prisma.$queryRaw<
      Array<{
        fno: string;
        saleDate: string;
        productCode: string;
        productName: string | null;
        customerCode: string;
        customerName: string | null;
        amount: number;
      }>
    >`
      SELECT
        s.fno,
        s."saleDate",
        s."productCode",
        s."productName",
        s."customerCode",
        c.name AS "customerName",
        s.amount
      FROM "GdSaleDetail" s
      LEFT JOIN "GdCustomer" c ON s."customerCode" = c.code
      WHERE s."productCode" = ']000000000001'
        AND s."saleDate" >= ${startDate}
        AND s."saleDate" <= ${endDate}
      ORDER BY s."saleDate" ASC, s.fno ASC
    `;

    // 일별 그룹핑
    const dailyMap = new Map<
      string,
      {
        date: string;
        entries: Array<{
          type: 'in' | 'out';
          amount: number;
          description: string;
          source: string;
        }>;
        dailyCashIn: number;
        dailyCashOut: number;
        balance: number;
      }
    >();

    let totalCashIn = 0;
    let totalCashOut = 0;

    for (const row of rawEntries) {
      const date = row.saleDate;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          entries: [],
          dailyCashIn: 0,
          dailyCashOut: 0,
          balance: 0,
        });
      }

      const day = dailyMap.get(date)!;
      // amount 음수 → 입금 (현금수금은 항상 음수)
      const absAmount = Math.abs(row.amount);
      const isIn = row.amount < 0;

      // description: 거래처명 기반 (거래처명 없으면 전표번호 사용)
      const customerLabel =
        row.customerName && row.customerName !== '정비고객관리'
          ? row.customerName
          : row.fno;
      const productLabel = (row.productName ?? '현금수금')
        .replace(/\s+/g, ' ')
        .trim();
      const description = `${customerLabel} ${productLabel}`;

      if (isIn) {
        day.entries.push({
          type: 'in',
          amount: absAmount,
          description,
          source: '매출장',
        });
        day.dailyCashIn += absAmount;
        totalCashIn += absAmount;
      } else {
        // amount 양수 = 출금 (현재 데이터에서는 드문 케이스)
        day.entries.push({
          type: 'out',
          amount: absAmount,
          description,
          source: '매출장',
        });
        day.dailyCashOut += absAmount;
        totalCashOut += absAmount;
      }
    }

    // 일별 누계 잔액 계산 (이월시재 + 일별 입출금 누적)
    const dailyEntries = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    let runningBalance = carryOver;
    for (const day of dailyEntries) {
      runningBalance += day.dailyCashIn - day.dailyCashOut;
      day.balance = runningBalance;
    }

    const currentBalance = carryOver + totalCashIn - totalCashOut;

    return {
      carryOver,         // 이월시재 (startDate 이전 현금수금 누계)
      totalCashIn,       // 기간 내 총 현금 입금
      totalCashOut,      // 기간 내 총 현금 출금 (IO=1 미동기화로 현재 0)
      currentBalance,    // 현재 시재 (이월+입금-출금)
      dailyEntries,
    };
  }

  // 동기화 상태 조회
  async getSyncStatus() {
    try {
      const lastSync = await this.prisma.gdSyncLog.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });

      if (!lastSync) {
        return { lastSync: null, message: '동기화 이력 없음' };
      }

      return {
        lastSync: lastSync.completedAt,
        syncType: lastSync.syncType,
        tableName: lastSync.tableName,
        rowCount: lastSync.rowCount,
      };
    } catch {
      // GdSyncLog 테이블이 아직 없거나 데이터가 없는 경우
      // GdSaleDetail의 최신 날짜로 대체
      try {
        const latestSale = await this.prisma.gdSaleDetail.findFirst({
          orderBy: { saleDate: 'desc' },
          select: { saleDate: true },
        });
        return {
          lastSync: latestSale?.saleDate || null,
          message: latestSale ? '최근 전표 날짜 기준' : '데이터 없음',
        };
      } catch {
        return { lastSync: null, message: '조회 불가' };
      }
    }
  }
}
