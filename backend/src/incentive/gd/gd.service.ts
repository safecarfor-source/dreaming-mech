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

  // 현금 출납부 SQL 조건 (재사용)
  private readonly CASH_FILTER = `
    ("productCode" = ']000000000001'
     OR "productCode" = ']100000000001'
     OR ("saleType" = '3' AND ("customerCode" LIKE 'Z7%' OR "customerCode" IN ('Z1000011','Z1000012'))))
  `;

  // 특정 기간의 현금 입출금 순액 계산
  private async calcCashNet(from: string, to: string): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(
        CASE
          WHEN "productCode" = ']000000000001' THEN ABS(amount)
          WHEN "productCode" = ']100000000001' THEN -ABS(amount)
          WHEN "saleType" = '3' THEN -ABS(amount)
          ELSE 0
        END
      ), 0) AS total
      FROM "GdSaleDetail"
      WHERE "saleDate" >= ${from}
        AND "saleDate" < ${to}
        AND (
          "productCode" = ']000000000001'
          OR "productCode" = ']100000000001'
          OR ("saleType" = '3' AND ("customerCode" LIKE 'Z7%' OR "customerCode" IN ('Z1000011','Z1000012')))
        )
    `;
    return Number(result[0]?.total ?? 0);
  }

  // 이월시재 자동 계산: 가장 가까운 openingCash 기준점을 찾아 체인 계산
  private async resolveCarryOver(startDate: string): Promise<{ carryOver: number; hasBaseline: boolean }> {
    const startYear = parseInt(startDate.slice(0, 4));
    const startMonth = parseInt(startDate.slice(5, 7));

    // 최대 24개월 뒤로 탐색하여 openingCash가 설정된 월 찾기
    let y = startYear;
    let m = startMonth;
    for (let i = 0; i < 24; i++) {
      const cf = await this.prisma.cashFlow.findUnique({
        where: { year_month: { year: y, month: m } },
      });
      if (cf?.openingCash != null) {
        // 기준점 발견! 기준점 월초 → startDate까지 거래 누적
        const baseDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const baseAmount = Number(cf.openingCash);
        if (baseDate >= startDate) {
          // 기준점이 startDate 이후면 역방향 계산 불가 → 기준점 그대로
          return { carryOver: baseAmount, hasBaseline: true };
        }
        const net = await this.calcCashNet(baseDate, startDate);
        return { carryOver: baseAmount + net, hasBaseline: true };
      }
      // 이전 달로 이동
      m--;
      if (m < 1) { m = 12; y--; }
    }

    // 기준점 없음: 올해 1/1부터 계산 (12년 합산 방지)
    const yearStart = `${startYear}-01-01`;
    const net = await this.calcCashNet(yearStart, startDate);
    return { carryOver: net, hasBaseline: false };
  }

  // 시재관리 (현금 출납부)
  // 현금 입금: IO=2, productCode=]000000000001 (현금수금)
  // 현금 출금: IO=1 ]100000000001 (현금결제) + IO=3 Z7%(경비)/Z1000011~12(은행)
  async getCashLedger(startDate: string, endDate: string) {
    // --- 이월시재 자동 계산 ---
    const { carryOver, hasBaseline } = await this.resolveCarryOver(startDate);

    // --- 기간 내 현금 관련 항목 전체 조회 ---
    const rawEntries = await this.prisma.$queryRaw<
      Array<{
        fno: string;
        saleDate: string;
        saleType: string;
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
        s."saleType",
        s."productCode",
        s."productName",
        s."customerCode",
        c.name AS "customerName",
        s.amount
      FROM "GdSaleDetail" s
      LEFT JOIN "GdCustomer" c ON s."customerCode" = c.code
      WHERE s."saleDate" >= ${startDate}
        AND s."saleDate" <= ${endDate}
        AND (
          s."productCode" = ']000000000001'
          OR s."productCode" = ']100000000001'
          OR (s."saleType" = '3' AND (s."customerCode" LIKE 'Z7%' OR s."customerCode" IN ('Z1000011','Z1000012')))
        )
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
        dailyMap.set(date, { date, entries: [], dailyCashIn: 0, dailyCashOut: 0, balance: 0 });
      }
      const day = dailyMap.get(date)!;
      const absAmount = Math.abs(row.amount);

      // 거래처명/상품명 조합으로 description 생성
      const custLabel = row.customerName?.replace(/\s+/g, '') || row.customerCode;
      const prodLabel = (row.productName ?? '').replace(/\s+/g, ' ').trim();

      if (row.productCode === ']000000000001') {
        // 현금수금 (입금)
        day.entries.push({ type: 'in', amount: absAmount, description: `${custLabel} 현금수금`, source: '매출장' });
        day.dailyCashIn += absAmount;
        totalCashIn += absAmount;
      } else if (row.productCode === ']100000000001') {
        // 매입 현금결제 (출금)
        day.entries.push({ type: 'out', amount: absAmount, description: `${custLabel} 현금결제`, source: '매입장' });
        day.dailyCashOut += absAmount;
        totalCashOut += absAmount;
      } else if (row.saleType === '3') {
        // IO=3 경비/은행 (출금)
        const source = row.customerCode.startsWith('Z7') ? '경비' : '은행';
        day.entries.push({ type: 'out', amount: absAmount, description: custLabel, source });
        day.dailyCashOut += absAmount;
        totalCashOut += absAmount;
      }
    }

    // 일별 누계 잔액 계산
    const dailyEntries = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    let runningBalance = carryOver;
    for (const day of dailyEntries) {
      runningBalance += day.dailyCashIn - day.dailyCashOut;
      day.balance = runningBalance;
    }

    const currentBalance = carryOver + totalCashIn - totalCashOut;

    return { carryOver, totalCashIn, totalCashOut, currentBalance, dailyEntries, hasBaseline };
  }

  // 일별 매출 조회 (극동 GdSaleDetail 기반)
  async getDailyRevenue(date: string) {
    const result = await this.prisma.$queryRaw<
      Array<{ total_revenue: number; sale_count: number }>
    >`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*)::int AS sale_count
      FROM "GdSaleDetail"
      WHERE "saleDate" = ${date}
        AND "saleType" = '2'
        AND "productCode" NOT LIKE ']%'
    `;

    const { total_revenue = 0, sale_count = 0 } = result[0] || {};
    return {
      date,
      totalRevenue: Number(total_revenue),
      saleCount: Number(sale_count),
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
