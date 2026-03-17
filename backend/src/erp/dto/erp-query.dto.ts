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
