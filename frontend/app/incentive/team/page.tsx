'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import incentiveApi from '@/lib/incentive-api';
import type { TeamIncentiveData, TeamMonthlyEntry, MonthlySalesTarget, CalcHistory } from '@/types/incentive';

// ===== 상수 =====

const ACCENT = '#3EA6FF';
const GREEN = '#10B981';
const RED = '#EF4444';

const ITEM_LABELS: Record<string, string> = {
  brake_oil: '브레이크오일',
  lining: '라이닝',
  mission_oil: '미션오일',
  diff_oil: '데후오일',
  wiper: '와이퍼',
  battery: '밧데리',
  ac_filter: '에어컨필터',
  guardian_h3: '가디안H3',
  guardian_h5: '가디안H5',
  guardian_h7: '가디안H7',
};

const ITEM_RATES: Record<string, number> = {
  brake_oil: 2.8,
  lining: 1.4,
  mission_oil: 2.8,
  diff_oil: 1.0,
  wiper: 0.3,
  battery: 0.5,
  ac_filter: 1.0,
  guardian_h3: 2.0,
  guardian_h5: 2.0,
  guardian_h7: 2.0,
};

// 2025년 월별 실제 매출 (극동 기준)
const LAST_YEAR_REVENUE: Record<number, number> = {
  1: 141000000, 2: 119870650, 3: 141360490, 4: 152108207,
  5: 145727900, 6: 125293560, 7: 161988450, 8: 158435400,
  9: 167255850, 10: 183964700, 11: 175339060, 12: 212235800,
};

// ===== 포맷 유틸 =====

function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function fmtMan(n: number): string {
  const man = Math.round(n / 10000);
  return man.toLocaleString('ko-KR') + '만';
}

function fmtBigWon(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만원';
  return n.toLocaleString() + '원';
}

function extractMonthNum(monthStr: string): number {
  const m = monthStr.match(/(\d+)월/);
  return m ? parseInt(m[1]) : 0;
}

function extractYearMonth(monthStr: string): { year: number; month: number } {
  const m = monthStr.match(/(\d+)년\s*(\d+)/);
  const year = m ? parseInt('20' + m[1]) : new Date().getFullYear();
  const month = m ? parseInt(m[2]) : new Date().getMonth() + 1;
  return { year, month };
}

// ===== CountUp 훅 =====

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = Date.now();
    const startVal = 0;
    function step() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ===== 서브 컴포넌트 =====

// 인센티브 금액 카드 (CountUp)
function IncentiveAmountCard({ inc }: { inc: TeamIncentiveData['incentive'] }) {
  const animated = useCountUp(inc.actual);
  const isLoss = inc.lost > 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>인센티브</div>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px' }}>
          {animated.toLocaleString('ko-KR')}원
        </div>
        {isLoss && (
          <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
            감액 전 {fmtWon(inc.calculated)}&nbsp;/&nbsp;감액 -{fmtWon(inc.lost)}
          </div>
        )}
      </div>
    </div>
  );
}

// 최소수량 + 달성 시 인센티브 분할 카드
function MinQtyCard({
  mqc,
  simIncentive,
  actualIncentive,
  isLoss,
}: {
  mqc: TeamIncentiveData['minQtyCheck'];
  simIncentive: number;
  actualIncentive: number;
  isLoss: boolean;
}) {
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        {/* 좌: 최소수량 달성/미달 */}
        <div style={{
          flex: 1, padding: '20px 16px', textAlign: 'center',
          background: isLoss ? 'rgba(239,68,68,0.07)' : 'rgba(62,166,255,0.07)',
          borderRight: '1px solid #F0F0F0',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>최소수량</div>
          <div style={{
            fontSize: 24, fontWeight: 900,
            color: isLoss ? RED : ACCENT,
            letterSpacing: '-0.5px',
          }}>
            {isLoss ? '미달' : '달성'}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {mqc.metCount}/{mqc.totalCount} 품목
          </div>
        </div>

        {/* 우: 달성 시 인센티브 */}
        <div style={{ flex: 1, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>목표 달성 시</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
            {fmtWon(simIncentive)}
          </div>
          <div style={{ fontSize: 11, color: isLoss ? RED : GREEN, marginTop: 4, fontWeight: 600 }}>
            {isLoss
              ? `+${fmtWon(simIncentive - actualIncentive)} 더 받을 수 있음`
              : '100% 수령 중'}
          </div>
        </div>
      </div>
    </div>
  );
}

// 매출 예측 카드
function SalesForecastCard({
  monthNum,
  stData,
}: {
  monthNum: number;
  stData: MonthlySalesTarget;
}) {
  const lyTotal = LAST_YEAR_REVENUE[monthNum] || 0;
  const tysSales = stData.tysSales || 0;
  const elapsed = stData.tyElapsed || 0;
  const remain = stData.tyRemain || 0;
  const totalBiz = stData.totalBusinessDays || (elapsed + remain);

  if (!lyTotal || !tysSales || !elapsed) return null;

  const dailyAvg = Math.round(tysSales / elapsed);
  const projected = Math.round(dailyAvg * totalBiz);
  const growth = ((projected - lyTotal) / lyTotal) * 100;
  const progressPct = Math.min((tysSales / lyTotal) * 100, 150);
  const barWidth = Math.min(progressPct, 100);
  const isAhead = projected >= lyTotal;
  const neededDaily = remain > 0 ? Math.round((lyTotal - tysSales) / remain) : 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>{monthNum}월 매출 예측</div>

      {/* 진행 바 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
          <span>작년 대비 진행률</span>
          <span style={{ fontWeight: 700, color: isAhead ? GREEN : RED }}>
            {progressPct.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 12, background: '#EEEEEE', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${barWidth}%`,
            background: isAhead
              ? `linear-gradient(90deg, ${ACCENT}, ${GREEN})`
              : `linear-gradient(90deg, ${ACCENT}, ${RED})`,
            borderRadius: 8,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginTop: 2 }}>
          <span>현재 {fmtBigWon(tysSales)}</span>
          <span>작년 {fmtBigWon(lyTotal)}</span>
        </div>
      </div>

      {/* 일평균 */}
      <div style={{
        background: '#F9FAFB', borderRadius: 12, padding: '16px',
        textAlign: 'center', marginBottom: 10,
      }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{monthNum}월 일평균 매출</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px', marginBottom: 4 }}>
          {fmtMan(dailyAvg)}원
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: growth >= 0 ? GREEN : RED }}>
          작년 대비 {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </div>
      </div>

      {/* 필요 일평균 */}
      <div style={{
        background: isAhead ? '#F0FDF4' : '#FEF2F2',
        borderRadius: 12, padding: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>작년 동급 필요 일평균 매출</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: isAhead ? GREEN : RED, letterSpacing: '-1px' }}>
          {isAhead ? '달성!' : `${fmtMan(neededDaily)}원`}
        </div>
      </div>
    </div>
  );
}

// 이 달의 목표 카드 (최소수량 진행 바)
function MonthlyGoalCard({ mqc }: { mqc: TeamIncentiveData['minQtyCheck'] }) {
  if (!mqc.items.length) return null;

  const sorted = [...mqc.items].sort((a, b) => Number(a.met) - Number(b.met));

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>이 달의 목표</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sorted.map((mqi) => {
          const pct = mqi.target > 0 ? Math.round((mqi.current / mqi.target) * 100) : 0;
          const barColor = mqi.met ? GREEN : ACCENT;
          const statusText = mqi.met ? '달성' : `${mqi.target - mqi.current}개 남음`;

          return (
            <div key={mqi.itemKey}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                  {ITEM_LABELS[mqi.itemKey] ?? mqi.itemKey} ({mqi.current}/{mqi.target})
                </span>
              </div>
              <div style={{ height: 10, background: '#EEEEEE', borderRadius: 6, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(pct, 100)}%`,
                  background: barColor,
                  borderRadius: 6,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: mqi.met ? GREEN : RED, fontWeight: 600 }}>
                  {statusText}
                </span>
                <span style={{ fontSize: 11, color: '#999' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 오늘의 매출 카드
function TodayRevenueCard() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [saleCount, setSaleCount] = useState(0);
  const [error, setError] = useState(false);
  const [todayStr, setTodayStr] = useState('');
  const animated = useCountUp(revenue ?? 0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setTodayStr(today.replace(/-/g, '.'));
    incentiveApi
      .get<{ totalRevenue: number; saleCount: number }>('/gd/daily-revenue?date=' + today)
      .then((res) => {
        setRevenue(res.data.totalRevenue || 0);
        setSaleCount(res.data.saleCount || 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>오늘의 매출</div>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        {loading && <div style={{ color: '#999', fontSize: 13 }}>로딩 중...</div>}
        {error && <div style={{ color: RED, fontSize: 13 }}>일매출 조회 실패</div>}
        {!loading && !error && revenue !== null && (
          <>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{todayStr} 매출</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px', marginBottom: 4 }}>
              {Math.round(animated / 10000).toLocaleString()}만원
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              {saleCount.toLocaleString()}건 | {animated.toLocaleString()}원
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 데이터 업데이트 시간 표시
function UpdateTimeCard({ editedAt }: { editedAt: string }) {
  const dt = new Date(editedAt);
  const fmt = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;

  return (
    <div style={{ textAlign: 'center', fontSize: 11, color: '#BBBBBB', padding: '4px 0 8px' }}>
      마지막 자동계산 {fmt}
    </div>
  );
}

// ===== 공통 스타일 =====
const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  padding: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  border: '1px solid #F0F0F0',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#1A1A1A',
  marginBottom: 14,
  letterSpacing: '-0.3px',
};

// ===== 메인 페이지 =====

export default function IncentiveTeamPage() {
  const [monthList, setMonthList] = useState<TeamMonthlyEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [teamData, setTeamData] = useState<TeamIncentiveData | null>(null);
  const [stData, setStData] = useState<MonthlySalesTarget | null>(null);
  const [lastCalcAt, setLastCalcAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 초기: 월 목록 + 최신 calc-history 로드
  useEffect(() => {
    async function init() {
      try {
        const [monthRes, histRes] = await Promise.all([
          incentiveApi.get<TeamMonthlyEntry[]>('/team/monthly'),
          incentiveApi.get<CalcHistory[]>('/calc-history?limit=1').catch(() => ({ data: [] })),
        ]);
        const months = monthRes.data;
        if (!months || months.length === 0) {
          setError(true);
          setLoading(false);
          return;
        }
        setMonthList(months);

        // 마지막 자동계산 시간
        const histories = histRes.data;
        if (histories && histories.length > 0) {
          setLastCalcAt(histories[0].editedAt);
        }

        // 가장 최신 달 선택
        const latest = months[months.length - 1].month;
        setSelectedMonth(latest);
      } catch {
        setError(true);
        setLoading(false);
      }
    }
    init();
  }, []);

  // 월 변경 시 데이터 로드
  const loadMonthData = useCallback(async (month: string) => {
    if (!month) return;
    setLoading(true);
    setError(false);
    try {
      const { year, month: mn } = extractYearMonth(month);
      const [dataRes, stRes] = await Promise.all([
        incentiveApi.get<TeamIncentiveData>('/team/current?month=' + encodeURIComponent(month)),
        incentiveApi.get<MonthlySalesTarget>('/sales-target/' + year + '/' + mn).catch(() => ({ data: null })),
      ]);
      setTeamData(dataRes.data);
      setStData(stRes.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) loadMonthData(selectedMonth);
  }, [selectedMonth, loadMonthData]);

  // 시뮬레이션 인센티브 계산 (최소수량 미달 → 목표 수량 기준 재계산)
  function calcSimIncentive(data: TeamIncentiveData): number {
    const mqcMap: Record<string, TeamIncentiveData['minQtyCheck']['items'][0]> = {};
    data.minQtyCheck.items.forEach((mq) => { mqcMap[mq.itemKey] = mq; });

    let sim = 0;
    for (const [key, val] of Object.entries(data.items)) {
      const rate = ITEM_RATES[key] || 0;
      const mq = mqcMap[key];
      let sales = val.sales;
      if (mq && !mq.met && val.qty > 0) {
        const unitPrice = val.sales / val.qty;
        sales = Math.round(unitPrice * mq.target);
      }
      sim += Math.round(sales * rate / 100);
    }
    return sim;
  }

  // ===== 렌더 =====

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        .team-select {
          width: 100%; padding: 10px 14px; font-size: 15px; font-weight: 700;
          font-family: inherit; color: #1A1A1A; background: #F9FAFB;
          border: 1.5px solid #E0E0E0; border-radius: 10px; cursor: pointer;
          appearance: none; outline: none;
        }
        .team-select:focus { border-color: ${ACCENT}; }
      `}</style>

      {/* 월 선택기 */}
      <div style={{ marginBottom: 16 }}>
        <select
          className="team-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          disabled={monthList.length === 0}
        >
          {monthList.map((m) => (
            <option key={m.month} value={m.month}>{m.month}</option>
          ))}
        </select>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{
            width: 32, height: 32, border: `3px solid #EEEEEE`,
            borderTopColor: ACCENT, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 13 }}>로딩 중...</div>
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1A1A1A' }}>데이터가 없습니다</div>
          <div style={{ fontSize: 13 }}>극동 데이터 동기화를 확인해주세요</div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      {!loading && !error && teamData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 1. 매출 예측 (최상단) */}
          {stData && (
            <SalesForecastCard
              monthNum={extractMonthNum(selectedMonth)}
              stData={stData}
            />
          )}

          {/* 2. 인센티브 금액 */}
          <IncentiveAmountCard inc={teamData.incentive} />

          {/* 3. 최소수량 + 달성 시 인센티브 */}
          <MinQtyCard
            mqc={teamData.minQtyCheck}
            simIncentive={calcSimIncentive(teamData)}
            actualIncentive={teamData.incentive.actual}
            isLoss={teamData.incentive.lost > 0}
          />

          {/* 4. 이 달의 목표 */}
          <MonthlyGoalCard mqc={teamData.minQtyCheck} />

          {/* 5. 오늘의 매출 */}
          <TodayRevenueCard />

          {/* 6. 데이터 업데이트 시간 */}
          {lastCalcAt && <UpdateTimeCard editedAt={lastCalcAt} />}
        </div>
      )}
    </div>
  );
}
