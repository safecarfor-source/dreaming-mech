import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

interface ParsedRow {
  productCode: string;
  productName: string;
  qty: number;
  amount: number;
  category: string | null;
  label: string | null;
  isIncentive: boolean;
}

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  // 엑셀 파싱 + 미리보기
  async parseExcel(buffer: Buffer, month: string, uploaderId: string, fileName: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // 시트 찾기
    const sheetName = workbook.SheetNames.find(n => n.includes('매출거래처')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('시트를 찾을 수 없습니다');

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const mappings = await this.getMappings();

    const parsed: ParsedRow[] = [];
    let totalRevenue = 0;

    for (const row of rows) {
      const code = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      const qty = Number(row[3]) || 0;
      const amount = Number(row[5]) || 0;

      // 소계/누계/총계 행 스킵
      if (name.includes('소 계') || name.includes('누 계')) continue;
      if (name.includes('총 계')) {
        totalRevenue = amount;
        continue;
      }
      // 빈 행, 거래처명 행 스킵
      if (!code || code.length < 2) continue;

      const mapping = this.classifyProduct(code, mappings);
      parsed.push({
        productCode: code,
        productName: name,
        qty,
        amount,
        category: mapping?.category || null,
        label: mapping?.label || null,
        isIncentive: mapping?.isIncentive ?? false,
      });
    }

    // 카테고리별 합산
    const summary = this.summarize(parsed);

    // 업로드 레코드 저장
    const upload = await this.prisma.incentiveUpload.create({
      data: {
        uploaderId,
        month,
        uploadDate: new Date(),
        fileName,
        status: 'pending',
        rawData: { parsed, summary, totalRevenue } as any,
      },
    });

    return {
      uploadId: upload.id,
      month,
      totalRevenue,
      summary,
      unclassified: parsed.filter(p => !p.category),
      totalRows: parsed.length,
    };
  }

  // 업로드 승인 → DB 반영
  async approve(uploadId: string, approverId: string) {
    const upload = await this.prisma.incentiveUpload.findUnique({
      where: { id: uploadId },
    });
    if (!upload) throw new BadRequestException('업로드를 찾을 수 없습니다');
    if (upload.status === 'approved') throw new BadRequestException('이미 승인됨');

    const rawData = upload.rawData as any;
    const { summary, totalRevenue } = rawData;
    const uploadDate = upload.uploadDate;
    const month = upload.month;

    // 팀 인센티브 데이터 저장
    for (const [itemKey, data] of Object.entries(summary.incentiveItems as Record<string, any>)) {
      await this.prisma.incentiveData.upsert({
        where: { month_uploadDate_itemKey: { month, uploadDate, itemKey } },
        create: { month, uploadDate, itemKey, sales: data.sales, qty: data.qty },
        update: { sales: data.sales, qty: data.qty },
      });
    }

    // 김권중 데이터 (타이어 + 얼라이먼트)
    await this.prisma.managerIncentiveData.upsert({
      where: { month_uploadDate: { month, uploadDate } },
      create: {
        month,
        uploadDate,
        tireSales: summary.tireSales || 0,
        alignmentSales: summary.alignmentSales || 0,
      },
      update: {
        tireSales: summary.tireSales || 0,
        alignmentSales: summary.alignmentSales || 0,
      },
    });

    // 이정석 데이터 (전체매출 + 개별 항목)
    await this.prisma.directorIncentiveData.upsert({
      where: { month_uploadDate: { month, uploadDate } },
      create: {
        month,
        uploadDate,
        totalRevenue: totalRevenue || 0,
        wiperSales: summary.incentiveItems?.wiper?.sales || 0,
        batterySales: summary.incentiveItems?.battery?.sales || 0,
        acFilterSales: summary.incentiveItems?.ac_filter?.sales || 0,
      },
      update: {
        totalRevenue: totalRevenue || 0,
        wiperSales: summary.incentiveItems?.wiper?.sales || 0,
        batterySales: summary.incentiveItems?.battery?.sales || 0,
        acFilterSales: summary.incentiveItems?.ac_filter?.sales || 0,
      },
    });

    // 승인 처리
    await this.prisma.incentiveUpload.update({
      where: { id: uploadId },
      data: { status: 'approved', approvedAt: new Date() },
    });

    // 이력 기록
    await this.prisma.incentiveEditLog.create({
      data: {
        userId: approverId,
        action: 'approve',
        detail: JSON.stringify({ uploadId, month }),
      },
    });

    return { success: true, month };
  }

  // 업로드 이력
  async getHistory() {
    return this.prisma.incentiveUpload.findMany({
      include: { uploader: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // --- 내부 헬퍼 ---

  private async getMappings() {
    return this.prisma.productCodeMapping.findMany();
  }

  private classifyProduct(code: string, mappings: any[]) {
    // 1. 접두어 매칭 (isPrefix=true)
    for (const m of mappings.filter(m => m.isPrefix)) {
      if (code.startsWith(m.code)) {
        return { category: m.category, label: m.label, isIncentive: m.isIncentive };
      }
    }
    // 2. 정확 매칭
    const exact = mappings.find(m => !m.isPrefix && m.code === code);
    if (exact) {
      return { category: exact.category, label: exact.label, isIncentive: exact.isIncentive };
    }
    return null;
  }

  private summarize(parsed: ParsedRow[]) {
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
}
