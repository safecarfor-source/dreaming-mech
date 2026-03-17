/**
 * ERP 쿼리 DTO
 * Zod 스키마 기반 입력 유효성 검사
 */

import { z } from 'zod';

// ----------------------------------------
// 날짜 범위 쿼리
// ----------------------------------------
export const DateRangeQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD')
    .optional(),
});
export type DateRangeQueryDto = z.infer<typeof DateRangeQuerySchema>;

// ----------------------------------------
// 고객 검색 쿼리
// ----------------------------------------
export const CustomerQuerySchema = z.object({
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CustomerQueryDto = z.infer<typeof CustomerQuerySchema>;

// ----------------------------------------
// 리마인더 쿼리
// ----------------------------------------
export const ReminderQuerySchema = z.object({
  status: z
    .enum(['pending', 'sent', 'completed', 'dismissed'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ReminderQueryDto = z.infer<typeof ReminderQuerySchema>;

// ----------------------------------------
// 상위 상품 쿼리
// ----------------------------------------
export const TopProductsQuerySchema = DateRangeQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TopProductsQueryDto = z.infer<typeof TopProductsQuerySchema>;

// ----------------------------------------
// 카테고리 매핑 (상품코드 접두사 → 한글 카테고리)
// ----------------------------------------
export const PRODUCT_CATEGORY_MAP: Record<string, string> = {
  TA: '타이어', TH: '타이어', TK: '타이어', TM: '타이어',
  TC: '타이어', TP: '타이어', TB: '타이어', TL: '타이어',
  TG: '타이어', TZ: '타이어',
  AL: '얼라인먼트',
  PH: '브레이크', FP: '브레이크',
  RK: '밧데리', BX: '밧데리', AG: '밧데리', ZB: '밧데리',
  N0: '엔진오일',
  WH: '휠',
};

/**
 * 상품 코드에서 카테고리 추출
 * AGM* → '밧데리' (3자리 접두사 우선)
 */
export function getProductCategory(code: string): string {
  const upper = code.toUpperCase();

  // AGM 배터리는 3자리로 확인
  if (upper.startsWith('AGM')) return '밧데리';

  // 2자리 접두사 확인
  const prefix2 = upper.substring(0, 2);
  return PRODUCT_CATEGORY_MAP[prefix2] ?? '기타';
}

// ----------------------------------------
// 고객/차량 등록
// ----------------------------------------
export const CreateVehicleSchema = z.object({
  plateNumber: z.string().min(1, '차량번호 필수'),
  ownerName: z.string().min(1, '고객명 필수'),
  phone: z.string().optional(),
  carModel: z.string().optional(),
  carModel2: z.string().optional(),
  modelYear: z.string().optional(),
  color: z.string().optional(),
  displacement: z.string().optional(),
  memo: z.string().optional(),
});
export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;

// ----------------------------------------
// 매출 등록
// ----------------------------------------
export const CreateSaleSchema = z.object({
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식'),
  customerCode: z.string().min(1, '거래처 코드 필수'),
  productCode: z.string().min(1, '상품 코드 필수'),
  productName: z.string().optional(),
  qty: z.number().min(0.01, '수량 필수'),
  unitPrice: z.number().min(0, '단가 필수'),
  amount: z.number().min(0, '금액 필수'),
  saleType: z.enum(['1', '2', '3']).default('2'), // 1=입고(매입), 2=판매(매출), 3=반품
  memo: z.string().optional(),
});
export type CreateSaleDto = z.infer<typeof CreateSaleSchema>;

// ----------------------------------------
// 정비 등록
// ----------------------------------------
export const CreateRepairSchema = z.object({
  vehicleCode: z.string().min(1, '차량 코드 필수'),
  repairDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식'),
  productCode: z.string().optional(),
  productName: z.string().min(1, '정비 항목 필수'),
  qty: z.number().default(1),
  unitPrice: z.number().default(0),
  amount: z.number().min(0, '금액 필수'),
  mileage: z.number().optional(),
  memo: z.string().optional(),
});
export type CreateRepairDto = z.infer<typeof CreateRepairSchema>;
