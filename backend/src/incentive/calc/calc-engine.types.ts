// CalcEngine 결과 타입 정의

export interface MinQtyItem {
  itemKey: string;
  current: number;
  target: number;
  met: boolean;
  remaining: number;
}

export interface MinQtyCheckResult {
  hasUnmet: boolean;
  metCount: number;
  totalCount: number;
  items: MinQtyItem[];
}

export interface TeamCalcResult {
  month: string;
  calculated: number;    // 페널티 전 인센티브
  actual: number;        // 페널티 후 실지급 인센티브
  lost: number;          // 손실액
  penaltyRate: number;   // 0.5 or 1.0
  penalized: boolean;
  minQtyCheck: MinQtyCheckResult;
}

export interface ManagerCalcResult {
  month: string;
  tireSales: number;
  alignmentSales: number;
  tireIncentive: number;
  teamBonus: number;
  totalIncentive: number;
  baseSalary: number;
  totalSalary: number;
  fullTotalIncentive: number;
  lost: number;
  penalized: boolean;
}

export interface DirectorCalcResult {
  month: string;
  totalRevenue: number;
  revenueIncentive: number;
  extras: {
    wiper: { sales: number; incentive: number };
    battery: { sales: number; incentive: number };
    acFilter: { sales: number; incentive: number };
  };
  totalIncentive: number;
  breakeven: number;
  aboveBreakeven: boolean;
  shortfall: number;
}

export interface DashboardCalcResult {
  month: string;
  team: { calculated: number; actual: number; lost: number };
  manager: { total: number };
  director: { amount: number };
  grandTotal: number;
}

export interface AllCalcResult {
  team: TeamCalcResult;
  manager: ManagerCalcResult;
  director: DirectorCalcResult;
  dashboard: DashboardCalcResult;
}
