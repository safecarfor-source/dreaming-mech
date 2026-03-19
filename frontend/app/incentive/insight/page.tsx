'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { DashboardSummary, DirectorMonthlyEntry, MonthlySalesTarget, CashflowData } from '@/types/incentive';

// ===== recharts 동적 임포트 =====

const BarChart = dynamic(
  () => import('recharts').then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then((m) => m.Bar),
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
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const PieChart = dynamic(
  () => import('recharts').then((m) => m.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import('recharts').then((m) => m.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import('recharts').then((m) => m.Cell),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((m) => m.Legend),
  { ssr: false }
);

// ===== 상수 =====

const ACCENT = '#3EA6FF';
const GREEN = '#10B981';
const RED = '#EF4444';

const LAST_YEAR_REVENUE: Record<number, number> = {
  1: 141000000, 2: 119870650, 3: 141360490, 4: 152108207,
  5: 145727900, 6: 125293560, 7: 161988450, 8: 158435400,
  9: 167255850, 10: 183964700, 11: 175339060, 12: 212235800,
};

const PIE_COLORS = [ACCENT, GREEN, '#FFB020', '#CBD5E1'];

// ===== 유틸 =====

function fmtWon(n: number): string {
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

function fmtBigWon(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만원';
  return n.toLocaleString() + '원';
}

function fmtMan(n: number): string {
  const man = Math.round(n / 10000);
  return man.toLocaleString('ko-KR') + '만';
}

function extractMonthNum(monthStr: string): number {
  const m = monthStr.match(/(\d+)월/);
  return m ? parseInt(m[1]) : 0;
}

// ===== 공통 스타일 =====

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  padding: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  border: '1px solid #F0F0F0',
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#1A1A1A',
  marginBottom: 14,
  letterSpacing: '-0.3px',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  marginTop: 4,
};

const statCardStyle: React.CSSProperties = {
  background: '#F9FAFB',
  borderRadius: 12,
  padding: '14px',
  textAlign: 'center',
};

// ===== 인사이트 데이터 타입 =====

interface InsightData {
  summary: DashboardSummary;
  dirMonthly: DirectorMonthlyEntry[];
  salesTarget: MonthlySalesTarget | null;
  cashflows: CashflowData[];
  year: number;
  month: number;
}

// ===== 서브 컴포넌트 =====

// 매출 요약 카드 (2x2 그리드)
function RevenueSummaryCard({
  summary,
  salesTarget,
  month,
}: {
  summary: DashboardSummary;
  salesTarget: MonthlySalesTarget | null;
  month: number;
}) {
  const rev = summary.revenue || { total: 0, serviceItems: 0, tire: 0, alignment: 0, other: 0 };
  const totalRev = rev.total || 0;
  const pmChange = summary.prevMonth?.change || 0;
  const pyChange = summary.prevYear?.change || 0;
  const elapsed = salesTarget?.tyElapsed || 1;
  const dailyAvg = elapsed > 0 ? Math.round(totalRev / elapsed) : 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>{month}월 매출 요약</div>
      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>총 매출</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
            {fmtBigWon(totalRev)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>일평균 매출</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
            {fmtMan(dailyAvg)}원
          </div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{elapsed}일 경과</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>전월 대비</div>
          <div style={{
            fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px',
            color: pmChange >= 0 ? GREEN : RED,
          }}>
            {pmChange >= 0 ? '+' : ''}{pmChange}%
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>전년 동월 대비</div>
          <div style={{
            fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px',
            color: pyChange >= 0 ? GREEN : RED,
          }}>
            {pyChange >= 0 ? '+' : ''}{pyChange}%
          </div>
        </div>
      </div>
    </div>
  );
}

// 월별 매출 트렌드 BarChart
function MonthlyTrendCard({ dirMonthly, currentMonth, currentYear }: {
  dirMonthly: DirectorMonthlyEntry[];
  currentMonth: number;
  currentYear: number;
}) {
  const recent12 = dirMonthly.slice(-12);
  if (recent12.length === 0) return null;

  const chartData = recent12.map((m) => {
    const label = (m.month || '').replace('년 ', '.').replace('월', '');
    const isThisMonth = m.month === `${currentYear - 2000}년 ${currentMonth}월`;
    return {
      label,
      revenue: m.totalRevenue || 0,
      fill: isThisMonth ? ACCENT : '#93C5FD',
    };
  });

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>월별 매출 추이</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#999' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#999' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 100000000)}억`}
          />
          <Tooltip
            formatter={(value) => [fmtWon(Number(value ?? 0)), '매출']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E0E0E0' }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 매출 구성 파이차트
function RevenueCompositionCard({ summary }: { summary: DashboardSummary }) {
  const rev = summary.revenue || { total: 0, serviceItems: 0, tire: 0, alignment: 0, other: 0 };
  const totalRev = rev.total || 0;
  if (totalRev === 0) return null;

  const pieData = [
    { name: '정비', value: rev.serviceItems || 0 },
    { name: '타이어', value: rev.tire || 0 },
    { name: '얼라인', value: rev.alignment || 0 },
    { name: '기타', value: rev.other || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>매출 구성</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
            }
            labelLine={{ stroke: '#999', strokeWidth: 1 }}
          >
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [fmtWon(Number(value ?? 0)), '']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E0E0E0' }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 12, color: '#444' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 전년 대비 성장률 (최근 3개월)
function YearOverYearCard({
  dirMonthly,
  currentYear,
}: {
  dirMonthly: DirectorMonthlyEntry[];
  currentYear: number;
}) {
  const thisYearMonths = dirMonthly.filter((m) =>
    (m.month || '').startsWith(`${currentYear - 2000}년`)
  );
  const recent3 = thisYearMonths.slice(-3);
  if (recent3.length === 0) return null;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>전년 동월 비교</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {recent3.map((m) => {
          const mn = extractMonthNum(m.month);
          const ly = LAST_YEAR_REVENUE[mn] || 0;
          const ty = m.totalRevenue || 0;
          const maxVal = Math.max(ly, ty, 1);
          const growPct = ly > 0 ? ((ty - ly) / ly * 100).toFixed(1) : 'N/A';
          const isUp = Number(growPct) >= 0;

          return (
            <div key={m.month}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 6,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{mn}월</span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isUp ? GREEN : RED,
                }}>
                  {isUp ? '▲' : '▼'} {growPct}%
                </span>
              </div>
              {/* 작년 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 35, fontSize: 10, color: '#999' }}>작년</span>
                <div style={{
                  flex: 1, height: 18, background: '#E8E8E8',
                  borderRadius: 5, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${ly / maxVal * 100}%`, height: '100%',
                    background: '#CBD5E1', borderRadius: 5,
                  }} />
                </div>
                <span style={{ width: 80, fontSize: 11, textAlign: 'right', color: '#666' }}>
                  {fmtBigWon(ly)}
                </span>
              </div>
              {/* 올해 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 35, fontSize: 10, color: '#999' }}>올해</span>
                <div style={{
                  flex: 1, height: 18, background: '#E8E8E8',
                  borderRadius: 5, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${ty / maxVal * 100}%`, height: '100%',
                    background: isUp ? GREEN : RED, borderRadius: 5,
                  }} />
                </div>
                <span style={{ width: 80, fontSize: 11, textAlign: 'right', fontWeight: 600 }}>
                  {fmtBigWon(ty)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 연간 누적 YTD
function YtdCard({
  dirMonthly,
  currentYear,
}: {
  dirMonthly: DirectorMonthlyEntry[];
  currentYear: number;
}) {
  const thisYearMonths = dirMonthly.filter((m) =>
    (m.month || '').startsWith(`${currentYear - 2000}년`)
  );
  const ytdTotal = thisYearMonths.reduce((sum, m) => sum + (m.totalRevenue || 0), 0);
  const ytdCount = thisYearMonths.length;
  let lyYtd = 0;
  for (let i = 1; i <= ytdCount; i++) lyYtd += LAST_YEAR_REVENUE[i] || 0;
  const ytdGrowth = lyYtd > 0 ? ((ytdTotal - lyYtd) / lyYtd * 100).toFixed(1) : '0';
  const ytdIsUp = Number(ytdGrowth) >= 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>연간 누적 (YTD)</div>
      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {currentYear}년 누적 ({ytdCount}개월)
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
            {fmtBigWon(ytdTotal)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {currentYear - 1}년 동기 누적
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
            {fmtBigWon(lyYtd)}
          </div>
          <div style={{ fontSize: 11, color: ytdIsUp ? GREEN : RED, marginTop: 4, fontWeight: 700 }}>
            {ytdIsUp ? '▲' : '▼'} {ytdGrowth}%
          </div>
        </div>
      </div>
    </div>
  );
}

// 자산 현황
function AssetSummaryCard({ summary }: { summary: DashboardSummary }) {
  const cf = summary.cashflow || { cash: 0, investment: 0, inventory: 0, totalAssets: 0 };
  const totalAssets = cf.totalAssets || 0;
  const cfCash = cf.cash || 0;
  const cfInv = cf.investment || 0;
  const cfStock = cf.inventory || 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>자산 현황</div>
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <div style={{ fontSize: 12, color: '#888' }}>총 자산</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-1px' }}>
          {fmtBigWon(totalAssets)}
        </div>
      </div>
      {totalAssets > 0 && (
        <>
          {/* 스택 바 */}
          <div style={{
            display: 'flex', height: 20, borderRadius: 8,
            overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{ width: `${cfCash / totalAssets * 100}%`, background: ACCENT }} />
            <div style={{ width: `${cfInv / totalAssets * 100}%`, background: GREEN }} />
            <div style={{ width: `${cfStock / totalAssets * 100}%`, background: '#FFB020' }} />
          </div>
          {/* 레전드 */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { label: '현금', val: cfCash, color: ACCENT },
              { label: '투자', val: cfInv, color: GREEN },
              { label: '재고', val: cfStock, color: '#FFB020' },
            ].map((item) => (
              <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: item.color, display: 'inline-block',
                }} />
                {item.label} {totalAssets > 0 ? (item.val / totalAssets * 100).toFixed(1) : 0}%
              </span>
            ))}
          </div>
        </>
      )}
      {/* 상세 테이블 */}
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>현금</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmtBigWon(cfCash)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '8px 0', color: '#666' }}>투자자산 (증권)</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmtBigWon(cfInv)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#666' }}>타이어 재고</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmtBigWon(cfStock)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ===== 메인 페이지 =====

export default function InsightPage() {
  const { user } = useIncentiveAuthStore();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.access?.includes('admin');

  useEffect(() => {
    if (!isAdmin) return;

    async function load() {
      setLoading(true);
      setError(null);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      try {
        const [summaryRes, dirMonthlyRes, salesTargetRes] = await Promise.all([
          incentiveApi.get<DashboardSummary>(`/dashboard/summary/${year}/${month}`),
          incentiveApi.get<DirectorMonthlyEntry[]>('/director/monthly'),
          incentiveApi
            .get<MonthlySalesTarget>(`/sales-target/${year}/${month}`)
            .catch(() => ({ data: null })),
        ]);

        // 최근 6개월 CashFlow
        const cfRequests: Promise<CashflowData>[] = [];
        let cy = year;
        let cm = month;
        for (let i = 0; i < 6; i++) {
          const capCy = cy;
          const capCm = cm;
          cfRequests.push(
            incentiveApi
              .get<CashflowData>(`/cashflow/${capCy}/${capCm}`)
              .then((r) => r.data)
              .catch(() => ({
                year: capCy, month: capCm,
                cash: 0, investment: 0, inventory: 0, totalAssets: 0,
              }))
          );
          cm--;
          if (cm === 0) { cm = 12; cy--; }
        }
        const cashflows = (await Promise.all(cfRequests)).reverse();

        setData({
          summary: summaryRes.data,
          dirMonthly: dirMonthlyRes.data || [],
          salesTarget: salesTargetRes.data,
          cashflows,
          year,
          month,
        });
      } catch (e: unknown) {
        const err = e as { message?: string };
        setError(err.message || '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{
        maxWidth: 520, margin: '0 auto',
        textAlign: 'center', padding: '60px 20px', color: '#999',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
          관리자만 접근 가능합니다
        </div>
        <div style={{ fontSize: 13 }}>관리자 계정으로 로그인해주세요</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '60px 20px', color: '#999' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 32, height: 32, border: '3px solid #EEEEEE',
          borderTopColor: ACCENT, borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <div style={{ fontSize: 13 }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 13, color: RED }}>인사이트 로드 실패: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* 매출 분석 섹션 */}
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>매출 분석</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
        {data.year}년 {data.month}월 기준
      </div>

      <RevenueSummaryCard
        summary={data.summary}
        salesTarget={data.salesTarget}
        month={data.month}
      />

      <MonthlyTrendCard
        dirMonthly={data.dirMonthly}
        currentMonth={data.month}
        currentYear={data.year}
      />

      <YearOverYearCard
        dirMonthly={data.dirMonthly}
        currentYear={data.year}
      />

      <RevenueCompositionCard summary={data.summary} />

      <YtdCard dirMonthly={data.dirMonthly} currentYear={data.year} />

      {/* 현금 흐름 섹션 */}
      <div style={{ height: 16 }} />
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>현금 흐름표</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
        {data.year}년 {data.month}월 기준
      </div>

      <AssetSummaryCard summary={data.summary} />

      {/* 전월 대비 변동 */}
      {data.summary.cashflow?.prevMonth && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>전월 대비 변동</div>
          <div style={statGridStyle}>
            {[
              {
                label: '현금 변동',
                val: data.summary.cashflow.prevMonth.cashChange || 0,
              },
              {
                label: '총 자산 변동',
                val: data.summary.cashflow.prevMonth.assetChange || 0,
              },
            ].map((item) => (
              <div key={item.label} style={statCardStyle}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{item.label}</div>
                <div style={{
                  fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px',
                  color: item.val >= 0 ? GREEN : RED,
                }}>
                  {item.val >= 0 ? '+' : ''}{fmtBigWon(item.val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자산 월별 추이 */}
      {data.cashflows.filter((c) => c && c.totalAssets > 0).length > 1 && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>자산 월별 추이</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.cashflows
              .filter((c) => c && c.totalAssets > 0)
              .map((c, idx) => {
                const label = `${(c.year || 0) % 100}.${c.month}`;
                const maxAsset = Math.max(
                  ...data.cashflows
                    .filter((x) => x && x.totalAssets > 0)
                    .map((x) => x.totalAssets)
                );
                const totalPct = maxAsset > 0 ? (c.totalAssets / maxAsset * 100) : 0;
                const cashPct = c.totalAssets > 0 ? (c.cash / c.totalAssets * 100) : 0;
                const invPct = c.totalAssets > 0 ? (c.investment / c.totalAssets * 100) : 0;
                const stockPct = c.totalAssets > 0 ? (c.inventory / c.totalAssets * 100) : 0;

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 32, fontSize: 11, color: '#999', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 16, background: '#EEEEEE', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', height: '100%', width: `${totalPct}%` }}>
                        <div style={{ width: `${cashPct}%`, background: ACCENT }} />
                        <div style={{ width: `${invPct}%`, background: GREEN }} />
                        <div style={{ width: `${stockPct}%`, background: '#FFB020' }} />
                      </div>
                    </div>
                    <span style={{ width: 64, fontSize: 11, textAlign: 'right', color: '#666', flexShrink: 0 }}>
                      {fmtBigWon(c.totalAssets)}
                    </span>
                  </div>
                );
              })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {[
              { label: '현금', color: ACCENT },
              { label: '투자', color: GREEN },
              { label: '재고', color: '#FFB020' },
            ].map((item) => (
              <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
