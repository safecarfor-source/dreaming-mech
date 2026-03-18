import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManagerSalesTargetService {
  constructor(private prisma: PrismaService) {}

  // 쉬는 날: 1월1일, 설, 추석만 (나머지는 모두 영업)
  private getKoreanHolidays(year: number): Set<string> {
    const holidays = new Set<string>();
    const add = (m: number, d: number) => {
      holidays.add(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    };

    add(1, 1); // 신정

    // 설/추석 (음력이라 연도별 하드코딩)
    if (year === 2025) {
      add(1, 28); add(1, 29); add(1, 30); // 설
      add(10, 5); add(10, 6); add(10, 7); // 추석
      add(10, 8); // 추석 대체공휴일
    } else if (year === 2026) {
      add(2, 16); add(2, 17); add(2, 18); // 설
      add(9, 24); add(9, 25); add(9, 26); // 추석
    } else if (year === 2027) {
      add(2, 5); add(2, 6); add(2, 7); // 설
      add(2, 8); // 설 대체공휴일
      add(9, 14); add(9, 15); add(9, 16); // 추석
    }

    return holidays;
  }

  // 2025년 이하: 월~토 영업 (일요일만 쉼)
  // 2026년 이상: 월~일 영업 (매일 영업, 공휴일만 제외)
  private countBusinessDays(year: number, month: number, fromDay = 1, toDay?: number): number {
    const holidays = this.getKoreanHolidays(year);
    const lastDay = toDay ?? new Date(year, month, 0).getDate();
    let count = 0;

    for (let d = fromDay; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      const dow = date.getDay();
      if (year <= 2025 && dow === 0) continue;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (holidays.has(dateStr)) continue;
      count++;
    }

    return count;
  }

  // 지난달 연/월 계산
  private prevMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }

  async get(year: number, month: number) {
    // 1) 이번달 타이어+얼라이먼트 매출
    const thisMonthStr = this.toMonthStr(year, month);
    const thisData = await this.prisma.managerIncentiveData.findFirst({
      where: { month: thisMonthStr },
      orderBy: { uploadDate: 'desc' },
    });

    // 2) 지난달 매출 (작년이 아니라 전월)
    const prev = this.prevMonth(year, month);
    const prevMonthStr = this.toMonthStr(prev.year, prev.month);
    const prevData = await this.prisma.managerIncentiveData.findFirst({
      where: { month: prevMonthStr },
      orderBy: { uploadDate: 'desc' },
    });

    // 3) 영업일수 자동 계산
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const totalBusinessDays = this.countBusinessDays(year, month);
    const prevBusinessDays = this.countBusinessDays(prev.year, prev.month);

    let tyElapsed: number;
    let tyRemain: number;

    if (isCurrentMonth) {
      // 한국 시간 기준 현재 시각
      const krNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const krHour = krNow.getHours();
      const today = krNow.getDate();

      // 오후 7시(19시) 이후: 당일 매출 확정 → 오늘까지 포함
      // 오후 7시 이전: 당일 미확정 → 전일까지만
      const dataUpToDay = krHour >= 19 ? today : (today > 1 ? today - 1 : 0);
      tyElapsed = dataUpToDay > 0 ? this.countBusinessDays(year, month, 1, dataUpToDay) : 0;
      tyRemain = totalBusinessDays - tyElapsed;
    } else {
      const monthEnd = new Date(year, month, 0);
      if (now > monthEnd) {
        tyElapsed = totalBusinessDays;
        tyRemain = 0;
      } else {
        tyElapsed = 0;
        tyRemain = totalBusinessDays;
      }
    }

    // 타이어+얼라이먼트 합산
    const tysSales = thisData ? Math.round(thisData.tireSales + thisData.alignmentSales) : null;
    const prevTotal = prevData ? Math.round(prevData.tireSales + prevData.alignmentSales) : null;

    return {
      year,
      month,
      prevTotal: prevTotal,
      prevDays: prevBusinessDays,
      prevYear: prev.year,
      prevMonth: prev.month,
      tysSales: tysSales,
      tyElapsed,
      tyRemain,
      totalBusinessDays,
      tireSales: thisData ? Math.round(thisData.tireSales) : null,
      alignmentSales: thisData ? Math.round(thisData.alignmentSales) : null,
      prevTireSales: prevData ? Math.round(prevData.tireSales) : null,
      prevAlignmentSales: prevData ? Math.round(prevData.alignmentSales) : null,
      autoPopulated: true,
    };
  }

  async upsert(year: number, month: number, data: {
    lyDays?: number;
    tyElapsed?: number;
    tyRemain?: number;
  }) {
    const thisMonthStr = this.toMonthStr(year, month);
    const thisData = await this.prisma.managerIncentiveData.findFirst({
      where: { month: thisMonthStr },
      orderBy: { uploadDate: 'desc' },
    });
    const prev = this.prevMonth(year, month);
    const prevMonthStr = this.toMonthStr(prev.year, prev.month);
    const prevData = await this.prisma.managerIncentiveData.findFirst({
      where: { month: prevMonthStr },
      orderBy: { uploadDate: 'desc' },
    });

    const prevTotal = prevData ? Math.round(prevData.tireSales + prevData.alignmentSales) : 0;
    const tysSales = thisData ? Math.round(thisData.tireSales + thisData.alignmentSales) : 0;

    const record = await this.prisma.managerMonthlySalesTarget.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        lyTotal: BigInt(prevTotal),
        lyDays: data.lyDays ?? this.countBusinessDays(prev.year, prev.month),
        tysSales: BigInt(tysSales),
        tyElapsed: data.tyElapsed ?? 0,
        tyRemain: data.tyRemain ?? 0,
      },
      update: {
        lyTotal: BigInt(prevTotal),
        tysSales: BigInt(tysSales),
        ...(data.lyDays !== undefined && { lyDays: data.lyDays }),
        ...(data.tyElapsed !== undefined && { tyElapsed: data.tyElapsed }),
        ...(data.tyRemain !== undefined && { tyRemain: data.tyRemain }),
      },
    });

    // 이정석 영업일수도 동기화 (같은 영업일수 공유)
    await this.syncDirectorBusinessDays(year, month, {
      tyElapsed: record.tyElapsed,
      tyRemain: record.tyRemain,
    });

    return {
      id: record.id,
      year: record.year,
      month: record.month,
      prevTotal: Number(record.lyTotal),
      prevDays: record.lyDays,
      tysSales: Number(record.tysSales),
      tyElapsed: record.tyElapsed,
      tyRemain: record.tyRemain,
    };
  }

  // 이정석 영업일수 동기화
  private async syncDirectorBusinessDays(year: number, month: number, data: { tyElapsed: number; tyRemain: number }) {
    try {
      const existing = await this.prisma.monthlySalesTarget.findUnique({
        where: { year_month: { year, month } },
      });
      if (existing) {
        await this.prisma.monthlySalesTarget.update({
          where: { year_month: { year, month } },
          data: { tyElapsed: data.tyElapsed, tyRemain: data.tyRemain },
        });
      } else {
        await this.prisma.monthlySalesTarget.create({
          data: {
            year, month,
            lyTotal: BigInt(0),
            lyDays: this.countBusinessDays(year - 1, month),
            tysSales: BigInt(0),
            tyElapsed: data.tyElapsed,
            tyRemain: data.tyRemain,
            customPct1: 10,
            customPct2: 15,
          },
        });
      }
    } catch (e) {
      // 동기화 실패해도 메인 저장은 유지
    }
  }

  private toMonthStr(year: number, month: number): string {
    const shortYear = year % 100;
    return `${shortYear}년 ${month}월`;
  }
}
