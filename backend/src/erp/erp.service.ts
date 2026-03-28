/**
 * ERP 서비스
 * 극동(GD) 테이블 기반 정비소 ERP 비즈니스 로직
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DateRangeQueryDto,
  CustomerQueryDto,
  ReminderQueryDto,
  TopProductsQueryDto,
  getProductCategory,
  CreateVehicleDto,
  CreateSaleDto,
  CreateRepairDto,
} from './dto/erp-query.dto';

@Injectable()
export class ErpService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // 오늘/이번달 날짜 헬퍼 (KST 기준)
  // ========================================
  private getKstNow(): Date {
    const now = new Date();
    // UTC+9 적용
    return new Date(now.getTime() + 9 * 60 * 60 * 1000);
  }

  private getTodayStr(): string {
    return this.getKstNow().toISOString().substring(0, 10);
  }

  private getMonthStart(): string {
    const d = this.getKstNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private getLastYearMonthStart(): string {
    const d = this.getKstNow();
    d.setFullYear(d.getFullYear() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private getLastYearMonthEnd(): string {
    const d = this.getKstNow();
    d.setFullYear(d.getFullYear() - 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return lastDay.toISOString().substring(0, 10);
  }

  // ========================================
  // 1. 대시보드
  // ========================================
  async getDashboard() {
    const today = this.getTodayStr();
    const monthStart = this.getMonthStart();
    const lyMonthStart = this.getLastYearMonthStart();
    const lyMonthEnd = this.getLastYearMonthEnd();

    // 오늘 매출 집계 (saleType='2' = 판매만)
    const todaySalesAgg = await this.prisma.gdSaleDetail.aggregate({
      where: { saleDate: today, saleType: '2' },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 이번달 누적 매출
    const monthSalesAgg = await this.prisma.gdSaleDetail.aggregate({
      where: {
        saleDate: { gte: monthStart, lte: today },
        saleType: '2',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 전년 동월 매출 (YoY 비교)
    const lyMonthAgg = await this.prisma.gdSaleDetail.aggregate({
      where: {
        saleDate: { gte: lyMonthStart, lte: lyMonthEnd },
        saleType: '2',
      },
      _sum: { amount: true },
    });

    // 이번달 방문 차량 수 (고객 수)
    const monthVehicleCount = await this.prisma.gdSaleDetail.groupBy({
      by: ['customerCode'],
      where: {
        saleDate: { gte: monthStart, lte: today },
        saleType: '2',
      },
    });

    // 전체 차량 등록 수
    const totalVehicles = await this.prisma.gdVehicle.count();

    // 처리 대기 리마인더 수
    const pendingReminders = await this.prisma.customerReminder.count({
      where: { status: 'pending' },
    });

    const todaySales = todaySalesAgg._sum.amount ?? 0;
    const monthSales = monthSalesAgg._sum.amount ?? 0;
    const lyMonthSales = lyMonthAgg._sum.amount ?? 0;

    // YoY 성장률
    const yoyGrowthPct =
      lyMonthSales > 0
        ? Math.round(((monthSales - lyMonthSales) / lyMonthSales) * 100 * 10) / 10
        : null;

    return {
      today: {
        sales: todaySales,
        transactionCount: todaySalesAgg._count.id,
        date: today,
      },
      month: {
        sales: monthSales,
        transactionCount: monthSalesAgg._count.id,
        customerCount: monthVehicleCount.length,
        avgTicket:
          monthVehicleCount.length > 0
            ? Math.round(monthSales / monthVehicleCount.length)
            : 0,
      },
      lastYear: {
        sales: lyMonthSales,
        period: `${lyMonthStart} ~ ${lyMonthEnd}`,
      },
      yoyGrowthPct,
      totalVehicles,
      pendingReminders,
    };
  }

  // ========================================
  // 2. 일별 매출
  // ========================================
  async getDailySales(query: DateRangeQueryDto) {
    const today = this.getTodayStr();
    const from = query.from ?? this.getMonthStart();
    const to = query.to ?? today;

    const rows = await this.prisma.gdSaleDetail.findMany({
      where: {
        saleDate: { gte: from, lte: to },
        saleType: '2',
      },
      select: { saleDate: true, amount: true, customerCode: true },
      orderBy: { saleDate: 'asc' },
    });

    // 날짜별 집계
    const byDate = new Map<
      string,
      { totalSales: number; customerSet: Set<string>; count: number }
    >();

    for (const row of rows) {
      if (!row.saleDate) continue;
      if (!byDate.has(row.saleDate)) {
        byDate.set(row.saleDate, { totalSales: 0, customerSet: new Set(), count: 0 });
      }
      const entry = byDate.get(row.saleDate)!;
      entry.totalSales += row.amount;
      entry.customerSet.add(row.customerCode);
      entry.count++;
    }

    const data = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      totalSales: Math.round(v.totalSales),
      customerCount: v.customerSet.size,
      transactionCount: v.count,
      avgTicket:
        v.customerSet.size > 0 ? Math.round(v.totalSales / v.customerSet.size) : 0,
    }));

    const totalSales = data.reduce((s, d) => s + d.totalSales, 0);

    return { data, meta: { from, to, totalSales } };
  }

  // ========================================
  // 3. 카테고리별 매출
  // ========================================
  async getSalesByCategory(query: DateRangeQueryDto) {
    const today = this.getTodayStr();
    const from = query.from ?? this.getMonthStart();
    const to = query.to ?? today;

    const rows = await this.prisma.gdSaleDetail.findMany({
      where: {
        saleDate: { gte: from, lte: to },
        saleType: '2',
      },
      select: { productCode: true, amount: true, qty: true },
    });

    // 카테고리별 집계
    const byCategory = new Map<string, { sales: number; qty: number; count: number }>();

    for (const row of rows) {
      const cat = getProductCategory(row.productCode);
      if (!byCategory.has(cat)) {
        byCategory.set(cat, { sales: 0, qty: 0, count: 0 });
      }
      const entry = byCategory.get(cat)!;
      entry.sales += row.amount;
      entry.qty += row.qty;
      entry.count++;
    }

    const totalSales = Array.from(byCategory.values()).reduce(
      (s, v) => s + v.sales,
      0,
    );

    const data = Array.from(byCategory.entries())
      .map(([category, v]) => ({
        category,
        sales: Math.round(v.sales),
        qty: Math.round(v.qty),
        count: v.count,
        pct:
          totalSales > 0
            ? Math.round((v.sales / totalSales) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return { data, meta: { from, to, totalSales: Math.round(totalSales) } };
  }

  // ========================================
  // 4. 고객 검색
  // ========================================
  async searchCustomers(query: CustomerQueryDto) {
    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { plateNumber: { contains: q, mode: 'insensitive' as const } },
            { ownerName: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
            { carModel: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, vehicles] = await Promise.all([
      this.prisma.gdVehicle.count({ where }),
      this.prisma.gdVehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          repairs: {
            orderBy: { repairDate: 'desc' },
            take: 1,
            select: { repairDate: true, mileage: true },
          },
        },
      }),
    ]);

    // 차량별 총 지출 계산
    const vehicleCodes = vehicles.map(v => v.code);
    const spendAggs = await this.prisma.gdRepair.groupBy({
      by: ['vehicleCode'],
      where: { vehicleCode: { in: vehicleCodes } },
      _sum: { amount: true },
      _count: { id: true },
    });
    const spendMap = new Map(
      spendAggs.map(a => [a.vehicleCode, { totalSpend: a._sum.amount ?? 0, visitCount: a._count.id }]),
    );

    const data = vehicles.map(v => {
      const spend = spendMap.get(v.code);
      const lastRepair = v.repairs[0];
      return {
        code: v.code,
        plateNumber: v.plateNumber,
        ownerName: v.ownerName,
        phone: v.phone,
        carModel: v.carModel,
        modelYear: v.modelYear,
        lastRepairDate: lastRepair?.repairDate ?? null,
        lastMileage: lastRepair?.mileage ?? null,
        totalSpend: Math.round(spend?.totalSpend ?? 0),
        visitCount: spend?.visitCount ?? 0,
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========================================
  // 5. 고객 상세
  // ========================================
  async getCustomerDetail(code: string) {
    const vehicle = await this.prisma.gdVehicle.findUnique({
      where: { code_slot: { code, slot: 'A' } },
      include: {
        repairs: {
          orderBy: { repairDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`차량 코드 ${code}를 찾을 수 없습니다.`);
    }

    // 리마인더 별도 조회 (GdVehicle에 relation 없음)
    const activeReminders = await this.prisma.customerReminder.findMany({
      where: { vehicleCode: code, status: { in: ['pending', 'sent'] } },
      orderBy: { dueDate: 'asc' },
    });

    // 총 지출 계산
    const totalSpend = vehicle.repairs.reduce((s, r) => s + r.amount, 0);

    // 주행거리 추이
    const mileageHistory = vehicle.repairs
      .filter(r => r.mileage !== null)
      .map(r => ({ date: r.repairDate, mileage: r.mileage }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    return {
      data: {
        vehicle: {
          code: vehicle.code,
          plateNumber: vehicle.plateNumber,
          ownerName: vehicle.ownerName,
          phone: vehicle.phone,
          carModel: vehicle.carModel,
          carModel2: vehicle.carModel2,
          color: vehicle.color,
          displacement: vehicle.displacement,
          modelYear: vehicle.modelYear,
          purchaseDate: vehicle.purchaseDate,
          memo: vehicle.memo,
        },
        summary: {
          totalSpend: Math.round(totalSpend),
          visitCount: vehicle.repairs.length,
          firstVisitDate: vehicle.repairs.at(-1)?.repairDate ?? null,
          lastVisitDate: vehicle.repairs[0]?.repairDate ?? null,
          lastMileage: vehicle.repairs[0]?.mileage ?? null,
        },
        repairHistory: vehicle.repairs.map(r => ({
          id: r.id,
          repairDate: r.repairDate,
          productCode: r.productCode,
          productName: r.productName,
          qty: r.qty,
          unitPrice: r.unitPrice,
          amount: r.amount,
          mileage: r.mileage,
          memo: r.memo,
        })),
        mileageHistory,
        activeReminders,
      },
    };
  }

  // ========================================
  // 6. 방문 예측
  // ========================================
  async predictNextVisit(code: string) {
    const vehicle = await this.prisma.gdVehicle.findUnique({
      where: { code_slot: { code, slot: 'A' } },
      include: {
        repairs: {
          orderBy: { repairDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`차량 코드 ${code}를 찾을 수 없습니다.`);
    }

    const repairs = vehicle.repairs;
    if (repairs.length === 0) {
      return { data: { message: '정비 이력이 없어 예측이 불가합니다.' } };
    }

    const lastRepair = repairs[0];
    const lastDate = lastRepair.repairDate
      ? new Date(lastRepair.repairDate)
      : new Date();
    const lastMileage = lastRepair.mileage ?? 0;

    // 월평균 주행거리 계산 (주행거리가 있는 기록만 사용)
    const mileageRecords = repairs
      .filter(r => r.mileage !== null && r.repairDate !== null)
      .sort((a, b) => (a.repairDate ?? '').localeCompare(b.repairDate ?? ''));

    let avgKmPerMonth = 1000; // 기본값 1,000km/월
    if (mileageRecords.length >= 2) {
      const oldest = mileageRecords[0];
      const newest = mileageRecords[mileageRecords.length - 1];
      const months =
        (new Date(newest.repairDate!).getTime() - new Date(oldest.repairDate!).getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      if (months > 0) {
        avgKmPerMonth = Math.round(((newest.mileage ?? 0) - (oldest.mileage ?? 0)) / months);
      }
    }

    // 엔진오일 교환 주기: 매 10,000km 또는 6개월 (먼저 도달하는 쪽)
    const OIL_KM_INTERVAL = 10000;
    const OIL_MONTH_INTERVAL = 6;

    // 마지막 오일 교환 찾기
    const lastOilRepair = repairs.find(
      r => r.productCode?.startsWith('N0') || r.productName?.includes('엔진오일'),
    );
    const lastOilDate = lastOilRepair?.repairDate
      ? new Date(lastOilRepair.repairDate)
      : lastDate;
    const lastOilMileage = lastOilRepair?.mileage ?? lastMileage;

    const oilByKmDate = avgKmPerMonth > 0
      ? new Date(lastOilDate.getTime() + ((OIL_KM_INTERVAL / avgKmPerMonth) * 30 * 24 * 60 * 60 * 1000))
      : null;
    const oilByMonthDate = new Date(lastOilDate);
    oilByMonthDate.setMonth(oilByMonthDate.getMonth() + OIL_MONTH_INTERVAL);

    const oilDueDate = oilByKmDate && oilByKmDate < oilByMonthDate ? oilByKmDate : oilByMonthDate;
    const oilDueMileage = lastOilMileage + OIL_KM_INTERVAL;

    // 타이어 교환 주기: 매 40,000km 또는 2년
    const TIRE_KM_INTERVAL = 40000;
    const TIRE_YEAR_INTERVAL = 2;

    const lastTireRepair = repairs.find(
      r =>
        r.productCode?.match(/^(TA|TH|TK|TM|TC|TP|TB|TL|TG|TZ)/) ||
        r.productName?.includes('타이어'),
    );
    const lastTireDate = lastTireRepair?.repairDate
      ? new Date(lastTireRepair.repairDate)
      : null;
    const lastTireMileage = lastTireRepair?.mileage ?? null;

    const tireDueDate = lastTireDate
      ? (() => {
          const byKm = avgKmPerMonth > 0
            ? new Date(lastTireDate.getTime() + ((TIRE_KM_INTERVAL / avgKmPerMonth) * 30 * 24 * 60 * 60 * 1000))
            : null;
          const byYear = new Date(lastTireDate);
          byYear.setFullYear(byYear.getFullYear() + TIRE_YEAR_INTERVAL);
          return byKm && byKm < byYear ? byKm : byYear;
        })()
      : null;

    // 자동차 검사 주기: 신차 3년 후, 이후 2년마다 (연식 기반 추정)
    const modelYear = vehicle.modelYear ? parseInt(vehicle.modelYear, 10) : null;
    let inspectionDueDate: Date | null = null;
    if (modelYear) {
      const firstInspYear = modelYear + 3;
      const currentYear = new Date().getFullYear();
      if (currentYear < firstInspYear) {
        inspectionDueDate = new Date(`${firstInspYear}-06-30`);
      } else {
        const elapsed = currentYear - firstInspYear;
        const nextInsp = firstInspYear + Math.ceil((elapsed + 1) / 2) * 2;
        inspectionDueDate = new Date(`${nextInsp}-06-30`);
      }
    }

    return {
      data: {
        vehicleCode: code,
        plateNumber: vehicle.plateNumber,
        ownerName: vehicle.ownerName,
        carModel: vehicle.carModel,
        lastVisitDate: lastRepair.repairDate,
        lastMileage,
        avgKmPerMonth,
        estimatedCurrentMileage:
          avgKmPerMonth > 0
            ? Math.round(
                lastMileage +
                  ((new Date().getTime() - lastDate.getTime()) /
                    (1000 * 60 * 60 * 24 * 30)) *
                    avgKmPerMonth,
              )
            : null,
        predictions: {
          oilChange: {
            dueDate: oilDueDate?.toISOString().substring(0, 10) ?? null,
            dueMileage: oilDueMileage,
            lastChangedDate: lastOilRepair?.repairDate ?? null,
            lastChangedMileage: lastOilMileage || null,
            basis: '10,000km 또는 6개월 중 빠른 시기',
          },
          tireRotation: {
            dueDate: tireDueDate?.toISOString().substring(0, 10) ?? null,
            lastChangedDate: lastTireRepair?.repairDate ?? null,
            lastChangedMileage: lastTireMileage,
            basis: '40,000km 또는 2년 중 빠른 시기',
          },
          inspection: {
            dueDate: inspectionDueDate?.toISOString().substring(0, 10) ?? null,
            basis: '차량 연식 기반 추정 (정확한 일자는 교통안전공단 확인 필요)',
          },
        },
      },
    };
  }

  // ========================================
  // 7. 리마인더 목록
  // ========================================
  async getReminders(query: ReminderQueryDto) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [total, reminders] = await Promise.all([
      this.prisma.customerReminder.count({ where }),
      this.prisma.customerReminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return {
      data: reminders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========================================
  // 8. 리마인더 자동 생성
  // ========================================
  async generateReminders() {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    const created: {
      vehicleCode: string;
      reminderType: string;
      reason: string;
    }[] = [];

    // 배치 처리: 100대씩 커서 페이지네이션
    let cursor: number | undefined;
    const BATCH_SIZE = 100;

    while (true) {
      const vehicles = await this.prisma.gdVehicle.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        where: { slot: 'A' },
        orderBy: { id: 'asc' },
        include: {
          repairs: {
            orderBy: { repairDate: 'desc' },
            take: 5,
          },
        },
      });

      if (vehicles.length === 0) break;
      cursor = vehicles[vehicles.length - 1].id;

      for (const vehicle of vehicles) {
        const repairs = vehicle.repairs;
        // 리마인더 별도 조회 (GdVehicle에 relation 없음)
        const existingReminders = await this.prisma.customerReminder.findMany({
          where: { vehicleCode: vehicle.code, status: { in: ['pending', 'sent'] } },
          select: { reminderType: true },
        });
        const existingTypes = new Set(existingReminders.map(r => r.reminderType));

        if (repairs.length === 0) continue;

        const lastRepair = repairs[0];
        const lastRepairDate = lastRepair.repairDate
          ? new Date(lastRepair.repairDate)
          : null;

        if (!lastRepairDate) continue;

        const daysSinceLastVisit = Math.floor(
          (today.getTime() - lastRepairDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // 90일 미방문
        if (daysSinceLastVisit > 90 && !existingTypes.has('no_visit_3m')) {
          const dueDate = new Date(lastRepairDate);
          dueDate.setDate(dueDate.getDate() + 90);

          await this.prisma.customerReminder.create({
            data: {
              vehicleCode: vehicle.code,
              reminderType: 'no_visit_3m',
              dueDate,
              status: 'pending',
              message: `${vehicle.ownerName ?? '고객'}님 차량(${vehicle.plateNumber})이 ${daysSinceLastVisit}일간 미방문입니다.`,
            },
          });
          created.push({ vehicleCode: vehicle.code, reminderType: 'no_visit_3m', reason: `${daysSinceLastVisit}일 미방문` });
        }

        // 180일 미방문
        if (daysSinceLastVisit > 180 && !existingTypes.has('no_visit_6m')) {
          const dueDate = new Date(lastRepairDate);
          dueDate.setDate(dueDate.getDate() + 180);

          await this.prisma.customerReminder.create({
            data: {
              vehicleCode: vehicle.code,
              reminderType: 'no_visit_6m',
              dueDate,
              status: 'pending',
              message: `${vehicle.ownerName ?? '고객'}님 차량(${vehicle.plateNumber})이 6개월 이상 미방문입니다.`,
            },
          });
          created.push({ vehicleCode: vehicle.code, reminderType: 'no_visit_6m', reason: `${daysSinceLastVisit}일 미방문` });
        }

        // 엔진오일 교환 (마지막 오일 교환 후 6개월)
        const lastOilRepair = repairs.find(
          r => r.productCode?.startsWith('N0') || r.productName?.includes('엔진오일'),
        );
        if (lastOilRepair?.repairDate && !existingTypes.has('oil_change')) {
          const lastOilDate = new Date(lastOilRepair.repairDate);
          const monthsSinceOil =
            (today.getTime() - lastOilDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

          if (monthsSinceOil >= 6) {
            const dueDate = new Date(lastOilDate);
            dueDate.setMonth(dueDate.getMonth() + 6);

            await this.prisma.customerReminder.create({
              data: {
                vehicleCode: vehicle.code,
                reminderType: 'oil_change',
                dueDate,
                status: 'pending',
                message: `${vehicle.ownerName ?? '고객'}님 엔진오일 교환 시기입니다. 마지막: ${lastOilRepair.repairDate}`,
              },
            });
            created.push({ vehicleCode: vehicle.code, reminderType: 'oil_change', reason: `오일교환 ${Math.floor(monthsSinceOil)}개월 전` });
          }
        }

        // 타이어 교환
        const lastTireRepair = repairs.find(
          r =>
            r.productCode?.match(/^(TA|TH|TK|TM|TC|TP|TB|TL|TG|TZ)/) ||
            r.productName?.includes('타이어'),
        );
        if (
          lastTireRepair?.mileage &&
          lastRepair.mileage &&
          !existingTypes.has('tire_rotation')
        ) {
          const kmSinceTire = lastRepair.mileage - lastTireRepair.mileage;
          if (kmSinceTire >= 35000) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            await this.prisma.customerReminder.create({
              data: {
                vehicleCode: vehicle.code,
                reminderType: 'tire_rotation',
                dueDate,
                status: 'pending',
                message: `${vehicle.ownerName ?? '고객'}님 타이어 점검 필요. 교체 후 ${Math.round(kmSinceTire).toLocaleString()}km 주행.`,
              },
            });
            created.push({ vehicleCode: vehicle.code, reminderType: 'tire_rotation', reason: `타이어 ${Math.round(kmSinceTire).toLocaleString()}km` });
          }
        }
      }
    }

    return {
      data: {
        generated: created.length,
        items: created,
        generatedAt: todayStr,
      },
    };
  }

  // ========================================
  // 9. 상위 판매 상품
  // ========================================
  async getTopProducts(query: TopProductsQueryDto) {
    const today = this.getTodayStr();
    const from = query.from ?? this.getMonthStart();
    const to = query.to ?? today;
    const limit = query.limit ?? 10;

    const rows = await this.prisma.gdSaleDetail.findMany({
      where: {
        saleDate: { gte: from, lte: to },
        saleType: '2',
      },
      select: {
        productCode: true,
        productName: true,
        qty: true,
        amount: true,
      },
    });

    // 상품별 집계
    const byProduct = new Map<
      string,
      { productName: string; revenue: number; qty: number; count: number }
    >();

    for (const row of rows) {
      if (!byProduct.has(row.productCode)) {
        byProduct.set(row.productCode, {
          productName: row.productName ?? row.productCode,
          revenue: 0,
          qty: 0,
          count: 0,
        });
      }
      const entry = byProduct.get(row.productCode)!;
      entry.revenue += row.amount;
      entry.qty += row.qty;
      entry.count++;
    }

    const data = Array.from(byProduct.entries())
      .map(([productCode, v]) => ({
        productCode,
        productName: v.productName,
        category: getProductCategory(productCode),
        revenue: Math.round(v.revenue),
        qty: Math.round(v.qty),
        transactionCount: v.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return { data, meta: { from, to, limit } };
  }

  // ========================================
  // 10. 고객/차량 등록
  // ========================================
  async createVehicle(dto: CreateVehicleDto) {
    // 차량번호 정규화 (공백 제거)
    const normalizedPlate = dto.plateNumber.replace(/\s+/g, '').trim();

    // 트랜잭션으로 코드 생성 + 저장 (race condition 방지)
    return this.prisma.$transaction(async (tx) => {
      // 차량번호 중복 체크
      const existing = await tx.gdVehicle.findFirst({
        where: { plateNumber: normalizedPlate },
      });
      if (existing) {
        return { success: false, error: '이미 등록된 차량번호입니다.', existingCode: existing.code };
      }

      // 웹 등록 전용 코드: WEB- 접두사 (극동 동기화 충돌 방지)
      const lastWebVehicle = await tx.gdVehicle.findFirst({
        where: { code: { startsWith: 'WEB-' } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });

      let newCode = 'WEB-00001';
      if (lastWebVehicle?.code) {
        const num = parseInt(lastWebVehicle.code.replace('WEB-', ''), 10);
        if (!isNaN(num)) {
          newCode = 'WEB-' + String(num + 1).padStart(5, '0');
        }
      }

      const vehicle = await tx.gdVehicle.create({
        data: {
          code: newCode,
          plateNumber: normalizedPlate,
          ownerName: dto.ownerName,
          phone: dto.phone ?? null,
          carModel: dto.carModel ?? null,
          carModel2: dto.carModel2 ?? null,
          modelYear: dto.modelYear ?? null,
          color: dto.color ?? null,
          displacement: dto.displacement ?? null,
          memo: dto.memo ?? null,
        },
      });

      return { success: true, data: vehicle };
    });
  }

  // ========================================
  // 11. 매출/매입 등록
  // ========================================
  async createSale(dto: CreateSaleDto) {
    // 날짜 검증: 미래 날짜 불가, 1년 이전 불가
    const today = this.getTodayStr();
    if (dto.saleDate > today) {
      return { success: false, error: '미래 날짜로 등록할 수 없습니다.' };
    }
    const oneYearAgo = new Date(this.getKstNow());
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (dto.saleDate < oneYearAgo.toISOString().substring(0, 10)) {
      return { success: false, error: '1년 이전 날짜로 등록할 수 없습니다.' };
    }

    // 트랜잭션으로 전표번호 생성 + 저장 (race condition 방지)
    return this.prisma.$transaction(async (tx) => {
      const datePrefix = dto.saleDate.replace(/-/g, '');
      const lastSale = await tx.gdSaleDetail.findFirst({
        where: { fno: { startsWith: datePrefix } },
        orderBy: { fno: 'desc' },
        select: { fno: true },
      });

      let seq = 1;
      if (lastSale?.fno) {
        const lastSeq = parseInt(lastSale.fno.slice(8), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const fno = datePrefix + String(seq).padStart(4, '0');

      const sale = await tx.gdSaleDetail.create({
        data: {
          fno,
          saleDate: dto.saleDate,
          saleType: dto.saleType,
          customerCode: dto.customerCode,
          productCode: dto.productCode,
          productName: dto.productName ?? dto.productCode,
          qty: dto.qty,
          unitPrice: dto.unitPrice,
          amount: dto.amount,
        },
      });

      return { success: true, data: sale };
    });
  }

  // ========================================
  // 12. 정비 등록
  // ========================================
  async createRepair(dto: CreateRepairDto) {
    // 차량 존재 확인
    const vehicle = await this.prisma.gdVehicle.findUnique({
      where: { code_slot: { code: dto.vehicleCode, slot: 'A' } },
      include: {
        repairs: {
          orderBy: { repairDate: 'desc' },
          take: 1,
          select: { mileage: true, repairDate: true },
        },
      },
    });
    if (!vehicle) {
      return { success: false, error: '존재하지 않는 차량 코드입니다.' };
    }

    // 주행거리 역주행 방지
    if (dto.mileage != null && vehicle.repairs.length > 0) {
      const lastMileage = vehicle.repairs[0]?.mileage;
      if (lastMileage != null && dto.mileage < lastMileage) {
        return {
          success: false,
          error: `주행거리가 이전 기록(${lastMileage.toLocaleString()}km)보다 작습니다. 확인해주세요.`,
        };
      }
    }

    // 날짜 검증
    const today = this.getTodayStr();
    if (dto.repairDate > today) {
      return { success: false, error: '미래 날짜로 등록할 수 없습니다.' };
    }

    const repair = await this.prisma.gdRepair.create({
      data: {
        vehicleCode: dto.vehicleCode,
        repairDate: dto.repairDate,
        productCode: dto.productCode ?? null,
        productName: dto.productName,
        qty: dto.qty,
        unitPrice: dto.unitPrice,
        amount: dto.amount,
        mileage: dto.mileage ?? null,
        memo: dto.memo ?? null,
      },
    });

    return { success: true, data: repair };
  }

  // ========================================
  // 13. 상품 검색 (등록 폼에서 사용)
  // ========================================
  async searchProducts(q: string, limit = 10) {
    if (!q || q.length < 1) return { data: [] };

    const products = await this.prisma.gdProduct.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { altName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return { data: products };
  }

  // ========================================
  // 14. 동기화 상태 조회
  // ========================================
  async getSyncStatus() {
    try {
      const lastSync = await this.prisma.gdSyncLog.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });

      if (lastSync) {
        return {
          lastSync: lastSync.completedAt,
          syncType: lastSync.syncType,
          tableName: lastSync.tableName,
          rowCount: lastSync.rowCount,
        };
      }
    } catch {
      // GdSyncLog 비어있으면 최근 전표로 대체
    }

    // 최근 전표 날짜 기준
    const latestSale = await this.prisma.gdSaleDetail.findFirst({
      orderBy: { saleDate: 'desc' },
      select: { saleDate: true, createdAt: true },
    });

    return {
      lastSync: latestSale?.createdAt ?? null,
      lastSaleDate: latestSale?.saleDate ?? null,
      message: latestSale ? '최근 전표 날짜 기준' : '데이터 없음',
    };
  }
}
