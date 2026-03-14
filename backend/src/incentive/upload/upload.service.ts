import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface ParsedRow {
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

  // 엑셀 파싱 + 자동 승인
  async parseExcel(buffer: Buffer, month: string, uploaderId: string, fileName: string, dataDate?: string) {
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

      // 소계/누계/총계 행 스킵 — 극동 파일은 열0(코드)에 [총  계] 등이 있음
      const codeNorm = code.replace(/\s+/g, '');
      if (codeNorm.includes('소계') || codeNorm.includes('누계')) continue;
      if (codeNorm.includes('총계')) {
        totalRevenue = amount;
        continue;
      }
      // 이름에도 같은 체크 (호환)
      const nameNorm = name.replace(/\s+/g, '');
      if (nameNorm.includes('소계') || nameNorm.includes('누계')) continue;
      if (nameNorm.includes('총계')) {
        totalRevenue = amount;
        continue;
      }
      // 빈 행, 헤더 행, 거래처명 행 스킵
      if (!code || code.length < 2) continue;
      if (code === '상품코드' || code.includes('거래처명')) continue;
      // *** 별표 행 스킵
      if (name.includes('***')) continue;

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

    // dataDate가 있으면 사용자가 선택한 날짜, 없으면 현재 시각
    const uploadDate = dataDate ? new Date(dataDate + 'T00:00:00+09:00') : new Date();

    // 업로드 레코드 저장 (자동 승인)
    const upload = await this.prisma.incentiveUpload.create({
      data: {
        uploaderId,
        month,
        uploadDate,
        fileName,
        status: 'approved',
        approvedAt: new Date(),
        rawData: { parsed, summary, totalRevenue, dataDate: dataDate || null } as any,
      },
    });

    // 자동으로 DB 반영 (팀 + 김권중 + 이정석)
    await this.applyToDb(month, uploadDate, summary, totalRevenue, uploaderId, upload.id);

    return {
      uploadId: upload.id,
      month,
      totalRevenue,
      summary,
      unclassified: parsed.filter(p => !p.category),
      totalRows: parsed.length,
      autoApproved: true,
    };
  }

  // DB에 인센티브 데이터 반영 (팀 + 김권중 + 이정석)
  private async applyToDb(month: string, uploadDate: Date, summary: any, totalRevenue: number, userId: string, uploadId: string) {
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

    // 이력 기록
    await this.prisma.incentiveEditLog.create({
      data: {
        userId,
        action: 'auto_approve',
        detail: JSON.stringify({ uploadId, month }),
      },
    });
  }

  // 수동 승인 (이전 pending 건 처리용)
  async approve(uploadId: string, approverId: string) {
    const upload = await this.prisma.incentiveUpload.findUnique({
      where: { id: uploadId },
    });
    if (!upload) throw new BadRequestException('업로드를 찾을 수 없습니다');
    if (upload.status === 'approved') throw new BadRequestException('이미 승인됨');

    const rawData = upload.rawData as any;
    const { summary, totalRevenue } = rawData;

    await this.applyToDb(upload.month, upload.uploadDate, summary, totalRevenue, approverId, uploadId);

    await this.prisma.incentiveUpload.update({
      where: { id: uploadId },
      data: { status: 'approved', approvedAt: new Date() },
    });

    return { success: true, month: upload.month };
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
