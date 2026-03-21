// 인센티브 계산에 사용되는 품목별 요율 (%)
export const ITEM_RATES: Record<string, number> = {
  brake_oil: 2.8, lining: 1.4, mission_oil: 2.8, diff_oil: 1.0,
  wiper: 0.3, battery: 0.5, ac_filter: 1.0,
  guardian_h3: 2.0, guardian_h5: 2.0, guardian_h7: 2.0,
};

// 기본 기본급
export const BASE_SALARY = 3_300_000;

// 이사 인센티브 기본 fallback 값
export const DEFAULT_DIRECTOR_RATES = {
  revenueRate: 0.006,
  wiperRate: 0.003,
  batteryRate: 0.005,   // 실제 운영 데이터 기준 (0.003 → 0.005 수정)
  acFilterRate: 0.01,   // rates.ts에 누락되어 있던 값 추가
  breakeven: 145_000_000,
};
