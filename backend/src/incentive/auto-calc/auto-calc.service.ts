import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ClassifiedRow {
  productCode: string;
  productName: string;
  qty: number;
  amount: number;
  category: string | null;
  label: string | null;
  isIncentive: boolean;
}

@Injectable()
export class AutoCalcService {
  private readonly logger = new Logger(AutoCalcService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * GdRepair 데이터 기반으로 인센티브 자동 계산
   * (기존 엑셀 업로드와 동일한 결과를 자동으로 생성)
   */
  async calculateMonth(targetMonth?: string) {
    // 1. 대상 월 결정
    const month = targetMonth || this.currentKrMonth();
    const yearMonth = this.krMonthToYYYYMM(month); // "26년 3월" → "2026-03"

    this.logger.log(`자동 계산 시작: ${month} (${yearMonth})`);

    // 2. GdRepair에서 해당 월 데이터 조회
    const repairs = await this.prisma.gdRepair.findMany({
      where: {
        repairDate: { startsWith: yearMonth },
      },
      select: { productCode: true, productName: true, qty: true, amount: true },
    });

    if (repairs.length === 0) {
      this.logger.warn(`${month} 정비이력 0건 — 계산 스킵`);
      return { month, repairCount: 0, skipped: true };
    }

    // 3. ProductCodeMapping 조회
    const mappings = await this.prisma.productCodeMapping.findMany();

    // 4. 분류 + 집계 (UploadService와 동일 로직)
    // - 빈 상품코드 제외
    // - 극동 시스템은 출고(판매)=음수 qty → 절대값으로 변환
    // - 회계 코드(]0)로 시작하는 수금/공제 항목 제외 (totalRevenue 계산용)
    const classified: ClassifiedRow[] = repairs
      .filter(r => r.productCode && r.productCode.trim().length > 0)
      .map(r => {
        const mapping = this.classifyProduct(r.productCode!, mappings);
        return {
          productCode: r.productCode!,
          productName: r.productName || '',
          qty: Math.abs(r.qty),   // 음수 → 양수 변환
          amount: Math.abs(r.amount), // 음수 금액도 양수 변환
          category: mapping?.category || null,
          label: mapping?.label || null,
          isIncentive: mapping?.isIncentive ?? false,
        };
      });

    const summary = this.summarize(classified);

    // totalRevenue: 회계(수금/공제) 항목 제외, 비정상 금액(10억 이상) 제외
    const totalRevenue = classified
      .filter(r => r.category !== 'accounting' && r.category !== 'discount' && r.amount < 1_000_000_000)
      .reduce((sum, r) => sum + r.amount, 0);

    // 5. 기존 데이터 삭제 후 새로 저장 (덮어쓰기)
    const uploadDate = new Date();

    await this.prisma.incentiveData.deleteMany({ where: { month } });
    await this.prisma.managerIncentiveData.deleteMany({ where: { month } });
    await this.prisma.directorIncentiveData.deleteMany({ where: { month } });

    // 6. 팀 인센티브 저장
    for (const [itemKey, data] of Object.entries(summary.incentiveItems)) {
      await this.prisma.incentiveData.create({
        data: { month, uploadDate, itemKey, sales: data.sales, qty: data.qty },
      });
    }

    // 7. 김권중 (매니저) 저장
    await this.prisma.managerIncentiveData.create({
      data: {
        month,
        uploadDate,
        tireSales: summary.tireSales,
        alignmentSales: summary.alignmentSales,
      },
    });

    // 8. 이정석 (이사) 저장
    await this.prisma.directorIncentiveData.create({
      data: {
        month,
        uploadDate,
        totalRevenue,
        wiperSales: summary.incentiveItems.wiper?.sales || 0,
        batterySales: summary.incentiveItems.battery?.sales || 0,
        acFilterSales: summary.incentiveItems.ac_filter?.sales || 0,
      },
    });

    // 9. 이력 기록 (system 유저 확보)
    const systemUser = await this.getOrCreateSystemUser();
    await this.prisma.incentiveEditLog.create({
      data: {
        userId: systemUser.id,
        action: 'auto_calc',
        detail: JSON.stringify({
          month,
          totalRevenue,
          repairCount: repairs.length,
          classifiedCount: classified.filter(c => c.category).length,
          itemCount: Object.keys(summary.incentiveItems).length,
        }),
      },
    });

    this.logger.log(
      `자동 계산 완료: ${month} | 정비 ${repairs.length}건 | 총매출 ${totalRevenue.toLocaleString()}원 | 품목 ${Object.keys(summary.incentiveItems).length}개`,
    );

    return {
      month,
      totalRevenue,
      repairCount: repairs.length,
      classifiedCount: classified.filter(c => c.category).length,
      summary,
      skipped: false,
    };
  }

  /** 최근 자동계산 이력 조회 */
  async getStatus() {
    return this.prisma.incentiveEditLog.findMany({
      where: { action: 'auto_calc' },
      orderBy: { editedAt: 'desc' },
      take: 10,
    });
  }

  // --- 내부 헬퍼 ---

  /** 자동계산용 system 유저 (없으면 자동 생성) */
  private async getOrCreateSystemUser() {
    const existing = await this.prisma.incentiveUser.findFirst({
      where: { loginId: 'system' },
    });
    if (existing) return existing;

    return this.prisma.incentiveUser.create({
      data: {
        loginId: 'system',
        password: 'not-for-login',
        name: '자동계산',
        role: 'viewer',
      },
    });
  }

  // --- 분류/집계 로직 (UploadService와 동일) ---

  private classifyProduct(code: string, mappings: any[]) {
    // 1. 정확 매칭 먼저 (NN00000000020 = brake_oil이 NN = parts에 먹히지 않도록)
    const exact = mappings.find(m => !m.isPrefix && m.code === code);
    if (exact) {
      return { category: exact.category, label: exact.label, isIncentive: exact.isIncentive };
    }
    // 2. 접두어 매칭 (긴 코드부터 — 더 구체적인 매칭 우선)
    const prefixMatches = mappings
      .filter(m => m.isPrefix && code.startsWith(m.code))
      .sort((a, b) => b.code.length - a.code.length);
    if (prefixMatches.length > 0) {
      const m = prefixMatches[0];
      return { category: m.category, label: m.label, isIncentive: m.isIncentive };
    }
    return null;
  }

  private summarize(parsed: ClassifiedRow[]) {
    const incentiveItems: Record<string, { sales: number; qty: number }> = {};
    let tireSales = 0;
    let alignmentSales = 0;

    for (const row of parsed) {
      if (!row.category) continue;

      if (row.category === 'tire') {
        tireSales += row.amount;
      } else if (row.category === 'alignment') {
        alignmentSales += row.amount;
      }

      if (row.isIncentive) {
        if (!incentiveItems[row.category]) {
          incentiveItems[row.category] = { sales: 0, qty: 0 };
        }
        incentiveItems[row.category].sales += row.amount;
        incentiveItems[row.category].qty += row.qty;
      }
    }

    return { incentiveItems, tireSales, alignmentSales };
  }

  /** 현재 월을 한국 형식으로 ("26년 3월") */
  private currentKrMonth(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(2);
    const m = now.getMonth() + 1;
    return `${y}년 ${m}월`;
  }

  /** "26년 3월" → "2026-03" */
  private krMonthToYYYYMM(krMonth: string): string {
    const match = krMonth.match(/(\d+)년\s*(\d+)월/);
    if (!match) return '';
    const year = 2000 + parseInt(match[1]);
    const month = parseInt(match[2]).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}
