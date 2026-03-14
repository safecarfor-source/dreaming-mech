import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesTargetService {
  constructor(private prisma: PrismaService) {}

  // 한국 공휴일 (양력 고정 + 대체공휴일은 연도별 하드코딩)
  private getKoreanHolidays(year: number): Set<string> {
    const holidays = new Set<string>();
    const add = (m: number, d: number) => {
      holidays.add(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    };

    // 양력 고정 공휴일
    add(1, 1);   // 신정
    add(3, 1);   // 삼일절
    add(5, 5);   // 어린이날
    add(6, 6);   // 현충일
    add(8, 15);  // 광복절
    add(10, 3);  // 개천절
    add(10, 9);  // 한글날
    add(12, 25); // 크리스마스

    // 설/추석 (음력이라 연도별 하드코딩)
    if (year === 2025) {
      add(1, 28); add(1, 29); add(1, 30); // 설
      add(10, 5); add(10, 6); add(10, 7); // 추석
      add(5, 6);  // 대체공휴일 (어린이날)
    } else if (year === 2026) {
      add(2, 16); add(2, 17); add(2, 18); // 설
      add(9, 24); add(9, 25); add(9, 26); // 추석
      add(3, 2);  // 삼일절 대체
      add(5, 25); // 부처님오신날
      add(6, 8);  // 현충일 대체
    } else if (year === 2027) {
      add(2, 5); add(2, 6); add(2, 7); add(2, 8); // 설 + 대체
      add(9, 14); add(9, 15); add(9, 16);          // 추석
    }

    return holidays;
  }

  // 특정 월의 영업일수 계산
  // 2025년 이하: 월~토 영업 (일요일만 쉼)
  // 2026년 이상: 월~일 영업 (매일 영업, 공휴일만 제외)
  private countBusinessDays(year: number, month: number, fromDay = 1, toDay?: number): number {
    const holidays = this.getKoreanHolidays(year);
    const lastDay = toDay ?? new Date(year, month, 0).getDate();
    let count = 0;

    for (let d = fromDay; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      const dow = date.getDay(); // 0=일, 6=토
      // 2025년 이전: 일요일 쉼
      if (year <= 2025 && dow === 0) continue;
      // 공휴일 체크
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (holidays.has(dateStr)) continue;
      count++;
    }

    return count;
  }

  async get(year: number, month: number) {
    // 1) 올해 해당월 매출 (DirectorIncentiveData)
    const thisMonthStr = this.toMonthStr(year, month);
    const thisData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: thisMonthStr },
      orderBy: { uploadDate: 'desc' },
    });

    // 2) 작년 동월 매출 (DirectorIncentiveData)
    const lastYearStr = this.toMonthStr(year - 1, month);
    const lastYearData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: lastYearStr },
      orderBy: { uploadDate: 'desc' },
    });

    // 3) 영업일수 자동 계산
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const totalBusinessDays = this.countBusinessDays(year, month);
    const lastYearBusinessDays = this.countBusinessDays(year - 1, month);

    let tyElapsed: number;
    let tyRemain: number;

    if (isCurrentMonth) {
      // 현재 월: 오늘까지 경과 영업일, 나머지 남은 영업일
      const today = now.getDate();
      tyElapsed = this.countBusinessDays(year, month, 1, today);
      tyRemain = totalBusinessDays - tyElapsed;
    } else {
      // 과거/미래 월: 전체 영업일
      const monthEnd = new Date(year, month, 0);
      if (now > monthEnd) {
        // 과거 월 — 전체 완료
        tyElapsed = totalBusinessDays;
        tyRemain = 0;
      } else {
        // 미래 월 — 아직 시작 안 함
        tyElapsed = 0;
        tyRemain = totalBusinessDays;
      }
    }

    // MonthlySalesTarget에 관리자 오버라이드 있으면 영업일수 반영
    const override = await this.prisma.monthlySalesTarget.findUnique({
      where: { year_month: { year, month } },
    });

    return {
      year,
      month,
      lyTotal: lastYearData ? Math.round(lastYearData.totalRevenue) : null,
      lyDays: override?.lyDays ?? lastYearBusinessDays,
      tysSales: thisData ? Math.round(thisData.totalRevenue) : null,
      tyElapsed: override?.tyElapsed ?? tyElapsed,
      tyRemain: override?.tyRemain ?? tyRemain,
      totalBusinessDays,
      autoPopulated: true,
    };
  }

  async upsert(year: number, month: number, data: {
    lyDays?: number;
    tyElapsed?: number;
    tyRemain?: number;
  }) {
    // 영업일수 오버라이드만 저장 (매출은 자동)
    const thisMonthStr = this.toMonthStr(year, month);
    const thisData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: thisMonthStr },
      orderBy: { uploadDate: 'desc' },
    });
    const lastYearStr = this.toMonthStr(year - 1, month);
    const lastYearData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: lastYearStr },
      orderBy: { uploadDate: 'desc' },
    });

    const lyTotal = lastYearData ? Math.round(lastYearData.totalRevenue) : 0;
    const tysSales = thisData ? Math.round(thisData.totalRevenue) : 0;

    const record = await this.prisma.monthlySalesTarget.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        lyTotal: BigInt(lyTotal),
        lyDays: data.lyDays ?? this.countBusinessDays(year - 1, month),
        tysSales: BigInt(tysSales),
        tyElapsed: data.tyElapsed ?? 0,
        tyRemain: data.tyRemain ?? 0,
        customPct1: 10,
        customPct2: 15,
      },
      update: {
        lyTotal: BigInt(lyTotal),
        tysSales: BigInt(tysSales),
        ...(data.lyDays !== undefined && { lyDays: data.lyDays }),
        ...(data.tyElapsed !== undefined && { tyElapsed: data.tyElapsed }),
        ...(data.tyRemain !== undefined && { tyRemain: data.tyRemain }),
      },
    });

    return {
      id: record.id,
      year: record.year,
      month: record.month,
      lyTotal: Number(record.lyTotal),
      lyDays: record.lyDays,
      tysSales: Number(record.tysSales),
      tyElapsed: record.tyElapsed,
      tyRemain: record.tyRemain,
    };
  }

  // "26년 3월" 형태로 변환
  private toMonthStr(year: number, month: number): string {
    const shortYear = year % 100;
    return `${shortYear}년 ${month}월`;
  }
}
