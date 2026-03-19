// ===== 인증 =====

export interface IncentiveUser {
  id?: number;
  loginId: string;
  name: string;
  role: 'admin' | 'manager' | 'director' | 'viewer';
  pin?: string;
  access: string[];
  plainPassword?: string;
}

// ===== 팀 인센티브 =====

export interface TeamItemData {
  sales: number;
  qty: number;
}

/** /team/current, /team/current?month= 응답 */
export interface TeamIncentiveData {
  month: string;
  items: Record<string, TeamItemData>;
  incentive: TeamIncentive;
  minQtyCheck: MinQtyCheck;
  prevMonth: {
    month: string;
    items: Record<string, TeamItemData>;
  } | null;
}

export interface TeamIncentive {
  calculated: number;
  lost: number;
  actual: number;
  penalized: boolean;
}

export interface MinQtyCheckItem {
  itemKey: string;
  target: number;
  current: number;
  met: boolean;
}

export interface MinQtyCheck {
  items: MinQtyCheckItem[];
  metCount: number;
  totalCount: number;
  hasUnmet: boolean;
}

/** /team/monthly 응답 — 배열 요소 */
export interface TeamMonthlyEntry {
  month: string;
  incentive: number;
  penalized: boolean;
}

// ===== 매니저 인센티브 =====

/** /manager/current 응답 (legacy 뷰) */
export interface ManagerIncentiveData {
  month: string;
  tireSales: number;
  alignmentSales: number;
  tireIncentive: number;
  teamBonus: number;
  totalIncentive: number;
  fullTotalIncentive?: number;
  lost: number;
}

/** /manager/monthly 응답 — 배열 요소 */
export interface ManagerMonthlyEntry {
  month: string;
  totalIncentive: number;
  tireIncentive: number;
  teamBonus: number;
  tireSales: number;
  alignmentSales: number;
}

/** /manager-sales-target/{year}/{month} 응답 */
export interface ManagerSalesTargetData {
  /** 이번달 타이어+얼라인 매출 합산 */
  tysSales: number | null;
  /** 경과 영업일 */
  tyElapsed: number | null;
  /** 남은 영업일 */
  tyRemain: number | null;
  /** 전체 영업일 */
  totalBusinessDays: number | null;
  /** 직전 달 매출 합산 */
  prevTotal: number | null;
  /** 직전 달 영업일 */
  prevDays: number | null;
  /** 직전 달 번호 */
  prevMonth: number | null;
  /** 타이어 매출 */
  tireSales: number;
  /** 얼라인먼트 매출 */
  alignmentSales: number;
}

// ===== 부장(이정석) 인센티브 =====

/** /director/current 응답 */
export interface DirectorIncentiveData {
  month: string;
  totalRevenue: number;
  extras?: {
    wiper?: DirectorExtraItem;
    battery?: DirectorExtraItem;
    acFilter?: DirectorExtraItem;
  };
}

export interface DirectorExtraItem {
  qty: number;
  sales: number;
  incentive: number;
}

/** /director/monthly 응답 — 배열 요소 */
export interface DirectorMonthlyEntry {
  month: string;
  totalRevenue: number;
  wiperSales?: number;
  batterySales?: number;
}

// ===== 매출 목표 / 영업일 =====

/** /sales-target/{year}/{month} 응답 (부장 탭 + 팀 탭 공유) */
export interface MonthlySalesTarget {
  /** 이번달 매출 합산 */
  tysSales: number | null;
  /** 경과 영업일 */
  tyElapsed: number | null;
  /** 남은 영업일 */
  tyRemain: number | null;
  /** 전체 영업일 */
  totalBusinessDays: number | null;
  /** 작년 동월 매출 */
  lyTotal: number | null;
  /** 작년 동월 영업일 */
  lyDays: number | null;
}

// ===== 인사이트 대시보드 =====

export interface DashboardSummary {
  revenue: {
    total: number;
    serviceItems: number;
    tire: number;
    alignment: number;
    other: number;
  };
  prevMonth: {
    change: number;
  };
  prevYear: {
    change: number;
  };
  cashflow: CashflowSummary;
}

export interface CashflowSummary {
  cash: number;
  investment: number;
  inventory: number;
  totalAssets: number;
  prevMonth?: {
    cashChange: number;
    assetChange: number;
  };
}

/** /cashflow/{year}/{month} 응답 */
export interface CashflowData {
  year: number;
  month: number;
  cash: number;
  investment: number;
  inventory: number;
  totalAssets: number;
}

// ===== 설정(Config) =====

export interface IncentiveConfig {
  key: string;
  value: number;
  label?: string;
}

// ===== 상품 코드 매핑 =====

export type ProductCategory =
  | 'tire'
  | 'alignment'
  | 'brake_oil'
  | 'lining'
  | 'mission_oil'
  | 'diff_oil'
  | 'wiper'
  | 'battery'
  | 'ac_filter'
  | 'guardian_h3'
  | 'guardian_h5'
  | 'guardian_h7';

export interface ProductCodeMapping {
  id: string | number;
  code: string;
  isPrefix: boolean;
  category: ProductCategory | string;
  label: string;
  isIncentive: boolean;
}

// ===== 극동 차량 / 정비 / 상품 =====

export interface GdVehicle {
  code: string;
  plateNumber: string;
  carModel?: string;
  color?: string;
  modelYear?: number;
  ownerName?: string;
  phone?: string;
}

export interface GdRepair {
  repairDate: string;
  productName?: string;
  amount?: number;
  mileage?: number;
}

export interface GdProduct {
  code: string;
  name?: string;
  altName?: string;
  unit?: string;
  stock?: number;
  sellPrice1?: number;
  sellPrice2?: number;
  sellPrice3?: number;
  sellPrice4?: number;
  sellPrice5?: number;
  costPrice?: number;
  fixedPrice?: number;
}

/** /gd/vehicles 응답 */
export interface GdVehicleListResponse {
  data: GdVehicle[];
  total: number;
}

/** /gd/vehicles/{code}/repairs 응답 */
export interface GdRepairListResponse {
  repairs: GdRepair[];
  total: number;
}

/** /gd/products 응답 */
export interface GdProductListResponse {
  data: GdProduct[];
  total: number;
}

/** /gd/daily-revenue 응답 */
export interface GdDailyRevenue {
  date: string;
  totalRevenue: number;
  saleCount: number;
}

/** /gd/sale-detail — 상품별 판매 상세 */
export interface GdSaleDetail {
  saleDate: string;
  vehicleCode?: string;
  plateNumber?: string;
  productCode?: string;
  productName?: string;
  qty?: number;
  amount?: number;
  category?: string;
}

// ===== 시재관리 =====

export interface CashLedgerEntry {
  date: string;
  source?: string;
  description?: string;
  type: 'in' | 'out';
  amount: number;
  balance?: number;
}

export interface CashLedgerDayGroup {
  date: string;
  entries: CashLedgerEntry[];
}

/** /gd/cash-ledger 응답 */
export interface CashLedgerResponse {
  totalCashIn: number;
  totalCashOut: number;
  carryOver: number;
  dailyEntries: CashLedgerDayGroup[];
}

// ===== 자동 계산 이력 =====

export interface CalcHistory {
  id: number | string;
  editedAt: string;
  detail: string; // JSON 문자열 — CalcHistoryDetail로 파싱
}

export interface CalcHistoryDetail {
  repairCount: number;
  totalRevenue: number;
}

// ===== 업로드 이력 =====

export interface UploadHistory {
  id: number | string;
  status: 'approved' | 'pending' | string;
  createdAt?: string;
  uploadDate?: string;
}

// ===== 팀 최소수량 이력 =====

export interface TeamItemQtyHistoryResponse {
  /** { "26년 3월": { brake_oil: 5, lining: 3, ... } } */
  targets: Record<string, Record<string, number>>;
}
