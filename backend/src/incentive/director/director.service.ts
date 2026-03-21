import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalcEngineService } from '../calc/calc-engine.service';

@Injectable()
export class DirectorService {
  constructor(
    private prisma: PrismaService,
    private calcEngine: CalcEngineService,
  ) {}

  async getCurrent(month?: string) {
    const targetMonth = month || await this.getLatestMonth();
    if (!targetMonth) return null;

    // CalcEngine에서 계산 (단일 소스)
    return this.calcEngine.calcDirector(targetMonth);
  }

  async getMonthly() {
    const months = await this.prisma.directorIncentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'asc' },
    });

    const result: any[] = [];
    for (const { month } of months) {
      const data = await this.calcEngine.calcDirector(month);
      result.push(data);
    }
    return result;
  }

  private async getLatestMonth() {
    const latest = await this.prisma.directorIncentiveData.findFirst({
      orderBy: { month: 'desc' },
      select: { month: true },
    });
    return latest?.month || null;
  }
}
