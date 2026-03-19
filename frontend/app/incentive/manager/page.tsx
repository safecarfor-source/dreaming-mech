'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import incentiveApi from '@/lib/incentive-api';
import type {
  ManagerMonthlyEntry,
  ManagerSalesTargetData,
  TeamIncentiveData,
} from '@/types/incentive';

// recharts 동적 임포트 (SSR 비활성)
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import('recharts').then((m) => m.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((m) => m.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((m) => m.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((m) => m.Tooltip),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((m) => m.CartesianGrid),
  { ssr: false }
);

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

// ===== CountUp 훅 =====

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId: number;
    const start = Date.now();
    function step() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

// ===== KPI 카드 =====

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  const animated = useCountUp(value);
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
        {fmtBigWon(animated)}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ===== 차트 컴포넌트 =====

interface ChartEntry {
  month: string;
  value: number;
}

function SalesChart({ data }: { data: ChartEntry[] }) {
  if (!data.length) return null;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>월별 타이어+얼라인 매출 추이</div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#999' }}
              tickFormatter={(v: string) => v.replace(/^\d+년\s*/, '')}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#999' }}
              tickFormatter={(v: number) => (v / 100000000).toFixed(1) + '억'}
              width={40}
            />
            <Tooltip
              formatter={(v: unknown) => [fmtWon(Number(v)), '타이어+얼라인']}
              labelStyle={{ fontSize: 12 }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: ACCENT }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ===== 작년 대비 진행률 바 =====

function ProgressBar({
  current,
  prev,
  prevLabel,
  isAhead,
}: {
  current: number;
  prev: number;
  prevLabel: string;
  isAhead: boolean;
}) {
  const progressPct = prev > 0 ? Math.min((current / prev) * 100, 150) : 0;
  const barWidth = Math.min(progressPct, 100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
        <span>전월 대비 진행률</span>
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
        <span>현재 {fmtBigWon(current)}</span>
        <span>{prevLabel} {fmtBigWon(prev)}</span>
      </div>
    </div>
  );
}

// ===== 총 인센티브 카드 =====

function TotalIncentiveCard({
  data,
  teamData,
}: {
  data: ManagerSalesTargetData;
  teamData: TeamIncentiveData | null;
}) {
  const currentTireIncentive = Math.round((data.tysSales ?? 0) * 0.003);
  const teamInc = teamData?.incentive ?? null;
  const teamActual = teamInc ? teamInc.actual : 0;
  const teamCalc = teamInc ? teamInc.calculated : 0;
  const teamLost = teamInc ? teamInc.lost : 0;
  const teamBonus = Math.round(teamActual * 1.5);
  const fullTeamBonus = Math.round(teamCalc * 1.5);
  const teamBonusDiff = fullTeamBonus - teamBonus;
  const teamAchieved = teamLost === 0;
  const totalManagerIncentive = currentTireIncentive + teamBonus;
  const animated = useCountUp(totalManagerIncentive);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>총 인센티브</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
        {fmtWon(animated)}
      </div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>타이어 매출</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmtWon(data.tireSales)}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>얼라인먼트 매출</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmtWon(data.alignmentSales)}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>타이어 인센티브 (0.3%)</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: ACCENT }}>{fmtWon(currentTireIncentive)}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>
              팀 인센티브 x 1.5배{' '}
              <span style={{ color: teamAchieved ? GREEN : RED, fontWeight: 700 }}>
                {teamAchieved ? '달성' : `(차감: ${fmtWon(teamBonusDiff)})`}
              </span>
            </td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>
              {teamData ? fmtWon(teamBonus) : '-'}
            </td>
          </tr>
          <tr style={{ borderTop: '2px solid #F0F0F0' }}>
            <td style={{ padding: '8px 0', fontWeight: 800, color: '#1A1A1A' }}>총 지급 예정액</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900, color: ACCENT }}>{fmtWon(totalManagerIncentive)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ===== 매출 예측 카드 =====

function SalesForecastCard({
  data,
}: {
  data: ManagerSalesTargetData;
}) {
  const tysSales = data.tysSales ?? 0;
  const tyElapsed = data.tyElapsed ?? 0;
  const tyRemain = data.tyRemain ?? 0;
  const prevTotal = data.prevTotal ?? 0;
  const prevDays = data.prevDays ?? 0;
  const totalBizDays = data.totalBusinessDays ?? (tyElapsed + tyRemain);

  const tyAvg = tyElapsed > 0 ? tysSales / tyElapsed : 0;
  const mgrProjected = Math.round(tyAvg * totalBizDays);
  const mgrGrowth = prevTotal > 0 ? ((mgrProjected - prevTotal) / prevTotal) * 100 : 0;
  const prevAvg = prevDays > 0 ? prevTotal / prevDays : 0;
  const mgrProjIncentive = Math.round(mgrProjected * 0.003);
  const isAhead = prevTotal > 0 && tysSales / tyElapsed >= prevTotal / prevDays;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>당월 타이어 매출 예측</div>

      <div style={{ marginBottom: 16 }}>
        <ProgressBar
          current={tysSales}
          prev={prevTotal}
          prevLabel="전월"
          isAhead={isAhead}
        />
      </div>

      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', marginBottom: 4 }}>
          일 평균 {fmtMan(tyAvg)}원 매출 시
        </div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
          예상 타이어 인센티브: <b>{fmtBigWon(mgrProjIncentive)}</b>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: mgrGrowth >= 0 ? GREEN : RED }}>
          전월 대비 {mgrGrowth >= 0 ? '+' : ''}{mgrGrowth.toFixed(1)}%
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: isAhead ? GREEN : RED, fontWeight: 600 }}>
        {isAhead
          ? '시간 대비 앞서가는 중!'
          : `페이스업 필요! 일평균 ${fmtMan(prevAvg)} 이상 목표`}
      </div>
    </div>
  );
}

// ===== 팀 인센티브 현황 카드 =====

function TeamIncentiveCard({ teamData }: { teamData: TeamIncentiveData }) {
  const teamInc = teamData.incentive;
  const teamMqc = teamData.minQtyCheck;
  const teamCalc = teamInc.calculated;
  const teamLost = teamInc.lost;
  const teamActual = teamInc.actual;
  const teamBonus = Math.round(teamActual * 1.5);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>팀 인센티브 현황</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>팀 인센티브 합계</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmtWon(teamCalc)}</td>
          </tr>
          {teamLost > 0 && (
            <tr>
              <td style={{ padding: '5px 0', color: RED }}>감액 (-50%)</td>
              <td style={{ padding: '5px 0', textAlign: 'right', color: RED, fontWeight: 600 }}>-{fmtWon(teamLost)}</td>
            </tr>
          )}
          <tr style={{ borderTop: '2px solid #F0F0F0' }}>
            <td style={{ padding: '8px 0', fontWeight: 800 }}>김권중 적용 (x1.5배)</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900, color: ACCENT }}>{fmtWon(teamBonus)}</td>
          </tr>
        </tbody>
      </table>

      {teamMqc && teamMqc.items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ ...cardTitleStyle, marginBottom: 8 }}>필요 최소수량</div>
          <table style={tableStyle}>
            <tbody>
              {teamMqc.items.map((item) => {
                const short = item.met ? 0 : item.target - item.current;
                return (
                  <tr key={item.itemKey}>
                    <td style={{ padding: '4px 0', color: '#555' }}>
                      {ITEM_LABELS[item.itemKey] ?? item.itemKey}
                    </td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: item.met ? GREEN : RED }}>
                      {item.current}/{item.target} {item.met ? '달성' : `부족 ${short}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== 메인 페이지 =====

export default function IncentiveManagerPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<ManagerMonthlyEntry[]>([]);
  const [data, setData] = useState<ManagerSalesTargetData | null>(null);
  const [teamData, setTeamData] = useState<TeamIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 월별 이력 초기 로드
  useEffect(() => {
    incentiveApi
      .get<ManagerMonthlyEntry[]>('/manager/monthly')
      .then((res) => setMonthlyData(res.data ?? []))
      .catch(() => setMonthlyData([]));
  }, []);

  // 월 변경 시 데이터 로드
  const loadData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(false);
    const monthStr = `${y % 100}년 ${m}월`;
    try {
      const [stRes, teamRes] = await Promise.all([
        incentiveApi.get<ManagerSalesTargetData>(`/manager-sales-target/${y}/${m}`),
        incentiveApi
          .get<TeamIncentiveData>(`/team/current?month=${encodeURIComponent(monthStr)}`)
          .catch(() => ({ data: null })),
      ]);
      setData(stRes.data);
      setTeamData(teamRes.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(year, month);
  }, [year, month, loadData]);

  // 차트용 데이터 변환
  const chartData = monthlyData.map((m) => ({
    month: m.month,
    value: (m.tireSales ?? 0) + (m.alignmentSales ?? 0),
  }));

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const hasData =
    data != null &&
    data.prevTotal != null &&
    data.prevDays != null &&
    data.tysSales != null &&
    data.tyElapsed != null &&
    (data.prevDays ?? 0) > 0 &&
    (data.tyElapsed ?? 0) > 0;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        .mgr-select {
          padding: 10px 14px; font-size: 15px; font-weight: 700;
          font-family: inherit; color: #1A1A1A; background: #F9FAFB;
          border: 1.5px solid #E0E0E0; border-radius: 10px; cursor: pointer;
          appearance: none; outline: none;
        }
        .mgr-select:focus { border-color: ${ACCENT}; }
        @keyframes mgr-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* 이름 */}
      <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 16, letterSpacing: '-0.5px' }}>
        김권중
      </div>

      {/* 월 선택기 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          className="mgr-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ flex: 1 }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select
          className="mgr-select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          style={{ flex: 1 }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{
            width: 32, height: 32, border: '3px solid #EEEEEE',
            borderTopColor: ACCENT, borderRadius: '50%',
            animation: 'mgr-spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13 }}>로딩 중...</div>
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛞</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>데이터 로드 실패</div>
          <div style={{ fontSize: 13 }}>잠시 후 다시 시도해주세요</div>
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && data && !hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 차트는 항상 표시 */}
          {chartData.length > 0 && <SalesChart data={chartData} />}

          {/* 영업일 정보 */}
          {(data.tyElapsed != null || data.tyRemain != null) && (
            <div style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 13, color: '#666', fontWeight: 600 }}>
              경과 {data.tyElapsed ?? '-'}일 / 남은 {data.tyRemain ?? '-'}일
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛞</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
              {year}년 {month}월 데이터 부족
            </div>
            <div style={{ fontSize: 13 }}>
              {[
                data.prevTotal == null ? '지난달 매출' : null,
                data.tysSales == null ? '이번달 매출' : null,
              ]
                .filter(Boolean)
                .join(', ')}
              {' '}데이터가 아직 업로드되지 않았습니다.
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      {!loading && !error && data && hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 영업일 정보 */}
          {(data.tyElapsed != null || data.tyRemain != null) && (
            <div style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 13, color: '#666', fontWeight: 600 }}>
              경과 {data.tyElapsed ?? '-'}일 / 남은 {data.tyRemain ?? '-'}일
            </div>
          )}

          {/* KPI 카드: 타이어 + 얼라인 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <KpiCard
              label="타이어 매출"
              value={data.tireSales}
              sub={`인센티브 ${fmtWon(Math.round(data.tireSales * 0.003))}`}
            />
            <KpiCard
              label="얼라인먼트 매출"
              value={data.alignmentSales}
            />
          </div>

          {/* 차트 */}
          {chartData.length > 0 && <SalesChart data={chartData} />}

          {/* 총 인센티브 */}
          <TotalIncentiveCard data={data} teamData={teamData} />

          {/* 매출 예측 */}
          <SalesForecastCard data={data} />

          {/* 팀 인센티브 현황 */}
          {teamData && <TeamIncentiveCard teamData={teamData} />}
        </div>
      )}
    </div>
  );
}
