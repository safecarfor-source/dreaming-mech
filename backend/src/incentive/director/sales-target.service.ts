import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesTargetService {
  constructor(private prisma: PrismaService) {}

  async get(year: number, month: number) {
    const record = await this.prisma.monthlySalesTarget.findUnique({
      where: { year_month: { year, month } },
    });

    if (!record) {
      // DirectorIncentiveData에서 tysSales 자동 채움
      const monthStr = this.toMonthStr(year, month);
      const dirData = await this.prisma.directorIncentiveData.findFirst({
        where: { month: monthStr },
        orderBy: { uploadDate: 'desc' },
      });

      return {
        year,
        month,
        lyTotal: null,
        lyDays: null,
        tysSales: dirData ? Math.round(dirData.totalRevenue) : null,
        tyElapsed: null,
        tyRemain: null,
        customPct1: 10,
        customPct2: 15,
        autoPopulated: true,
      };
    }

    return {
      id: record.id,
      year: record.year,
      month: record.month,
      lyTotal: Number(record.lyTotal),
      lyDays: record.lyDays,
      tysSales: Number(record.tysSales),
      tyElapsed: record.tyElapsed,
      tyRemain: record.tyRemain,
      customPct1: record.customPct1,
      customPct2: record.customPct2,
      autoPopulated: false,
    };
  }

  async upsert(year: number, month: number, data: {
    lyTotal: number;
    lyDays: number;
    tysSales: number;
    tyElapsed: number;
    tyRemain: number;
    customPct1?: number;
    customPct2?: number;
  }) {
    const record = await this.prisma.monthlySalesTarget.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        lyTotal: BigInt(Math.round(data.lyTotal)),
        lyDays: data.lyDays,
        tysSales: BigInt(Math.round(data.tysSales)),
        tyElapsed: data.tyElapsed,
        tyRemain: data.tyRemain,
        customPct1: data.customPct1 ?? 10,
        customPct2: data.customPct2 ?? 15,
      },
      update: {
        lyTotal: BigInt(Math.round(data.lyTotal)),
        lyDays: data.lyDays,
        tysSales: BigInt(Math.round(data.tysSales)),
        tyElapsed: data.tyElapsed,
        tyRemain: data.tyRemain,
        ...(data.customPct1 !== undefined && { customPct1: data.customPct1 }),
        ...(data.customPct2 !== undefined && { customPct2: data.customPct2 }),
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
      customPct1: record.customPct1,
      customPct2: record.customPct2,
    };
  }

  // "26년 3월" 형태로 변환
  private toMonthStr(year: number, month: number): string {
    const shortYear = year % 100;
    return `${shortYear}년 ${month}월`;
  }
}
