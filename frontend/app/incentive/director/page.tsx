'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import incentiveApi from '@/lib/incentive-api';
import type { DirectorMonthlyEntry, MonthlySalesTarget } from '@/types/incentive';

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

// 5단계 배율 티어 (이정석 부장) — 전년 대비 성장률 기준
const DIR_TIERS = [
  { label: '하락2 (-10% 이하)',  min: -999, max: -10, rate: 0.3 },
  { label: '하락1 (-10%~-3%)',  min: -10,  max: -3,  rate: 0.5 },
  { label: '기준 (-3%~5%)',      min: -3,   max: 5,   rate: 0.6 },
  { label: '상승 (5%~10%)',      min: 5,    max: 10,  rate: 0.7 },
  { label: '상승2 (10% 이상)',   min: 10,   max: 999, rate: 0.8 },
];

const TIER_THRESHOLDS = [-Infinity, -10, -3, 5, 10];
const TIER_LV_NAMES = ['하락2', '하락1', '기준', '상승', '상승2'];

function getTierIdx(growth: number): number {
  if (growth <= -10) return 0;
  if (growth <= -3) return 1;
  if (growth <= 5) return 2;
  if (growth <= 10) return 3;
  return 4;
}

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

// ===== 총 매출 KPI 카드 =====

function TotalRevenueCard({ value }: { value: number }) {
  const animated = useCountUp(value);
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>이번달 총 매출</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px' }}>
        {fmtBigWon(animated)}
      </div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
        {animated.toLocaleString('ko-KR')}원
      </div>
    </div>
  );
}

// ===== 매출 추이 차트 =====

interface ChartEntry {
  month: string;
  value: number;
}

function RevenueChart({ data }: { data: ChartEntry[] }) {
  if (!data.length) return null;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>월별 매출 추이</div>
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
              formatter={(v: unknown) => [fmtWon(Number(v)), '총 매출']}
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

// ===== 총 인센티브 카드 =====

function TotalIncentiveCard({
  tysSales,
  lyTotal,
  currentGrowth,
  currentTierIdx,
}: {
  tysSales: number;
  lyTotal: number;
  currentGrowth: number;
  currentTierIdx: number;
}) {
  const tier = DIR_TIERS[currentTierIdx];
  const currentIncentive = Math.round(tysSales * tier.rate / 100);
  const animated = useCountUp(currentIncentive);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>총 인센티브</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
        {fmtWon(animated)}
      </div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>올해 매출</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmtWon(tysSales)}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>작년 매출</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmtWon(lyTotal)}</td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>성장률</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: currentGrowth >= 0 ? GREEN : RED }}>
              {currentGrowth >= 0 ? '+' : ''}{currentGrowth.toFixed(1)}%
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', color: '#555' }}>적용 요율 ({tier.label})</td>
            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{tier.rate}%</td>
          </tr>
          <tr style={{ borderTop: '2px solid #F0F0F0' }}>
            <td style={{ padding: '8px 0', fontWeight: 800, color: '#1A1A1A' }}>총 지급 예정액</td>
            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900, color: ACCENT }}>{fmtWon(currentIncentive)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ===== 작년 대비 진행률 바 =====

function ProgressBar({
  tysSales,
  lyTotal,
  isAhead,
}: {
  tysSales: number;
  lyTotal: number;
  isAhead: boolean;
}) {
  const progressPct = lyTotal > 0 ? Math.min((tysSales / lyTotal) * 100, 150) : 0;
  const barWidth = Math.min(progressPct, 100);

  return (
    <div>
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
  );
}

// ===== 매출 예측 카드 =====

function SalesForecastCard({ data }: { data: MonthlySalesTarget }) {
  const lyTotal = data.lyTotal ?? 0;
  const lyDays = data.lyDays ?? 0;
  const tysSales = data.tysSales ?? 0;
  const tyElapsed = data.tyElapsed ?? 0;
  const tyRemain = data.tyRemain ?? 0;
  const totalBizDays = data.totalBusinessDays ?? (tyElapsed + tyRemain);

  const lyAvg = lyDays > 0 ? lyTotal / lyDays : 0;
  const tyAvg = tyElapsed > 0 ? tysSales / tyElapsed : 0;
  const projected = Math.round(tyAvg * totalBizDays);
  const projectedGrowth = lyTotal > 0 ? ((projected - lyTotal) / lyTotal) * 100 : 0;
  const projTierIdx = getTierIdx(projectedGrowth);
  const projTier = DIR_TIERS[projTierIdx];
  const predIncentive = Math.round(projected * projTier.rate / 100);
  const isAhead = lyTotal > 0 && tyAvg >= lyAvg;
  const progressPct = lyTotal > 0 ? Math.min((tysSales / lyTotal) * 100, 150) : 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>이번 달 매출 예측</div>

      <div style={{ marginBottom: 16 }}>
        <ProgressBar tysSales={tysSales} lyTotal={lyTotal} isAhead={isAhead} />
        {/* 예상 레벨 마커 */}
        <div style={{ textAlign: 'right', fontSize: 10, color: '#999', marginTop: 4 }}>
          예상 {TIER_LV_NAMES[projTierIdx]}
        </div>
      </div>

      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', marginBottom: 4 }}>
          일 평균 {fmtMan(tyAvg)}원 매출 시
        </div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
          예상 인센티브: <b>{fmtBigWon(predIncentive)}</b>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: projectedGrowth >= 0 ? GREEN : RED }}>
          작년 대비 {projectedGrowth >= 0 ? '+' : ''}{projectedGrowth.toFixed(1)}% → {TIER_LV_NAMES[projTierIdx]}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: isAhead ? GREEN : RED, fontWeight: 600 }}>
        {isAhead
          ? '시간 대비 앞서가는 중!'
          : `페이스업 필요! 일평균 ${fmtMan(lyAvg)} 이상 목표`}
      </div>

      {/* 진행률 수치 표시 */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, fontSize: 12, color: '#666', textAlign: 'center' }}>
        경과 {tyElapsed}일 / 남은 {tyRemain}일
      </div>
    </div>
  );
}

// ===== 오늘의 목표 카드 =====

function TodayGoalCard({
  tysSales,
  lyTotal,
  tyRemain,
}: {
  tysSales: number;
  lyTotal: number;
  tyRemain: number;
}) {
  const [targetLvIdx, setTargetLvIdx] = useState(2);

  if (tyRemain <= 0) return null;

  const lvData = DIR_TIERS.map((t, i) => {
    const thres = TIER_THRESHOLDS[i];
    const target = !isFinite(thres) ? 0 : Math.round(lyTotal * (1 + thres / 100));
    const remain = target - tysSales;
    const daily = remain > 0 ? Math.round(remain / tyRemain) : 0;
    const achieved = tysSales >= target;
    return { target, remain, daily, achieved, rate: t.rate, label: t.label };
  });

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>오늘의 목표</div>

      {/* 일평균 목표 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F0F0F0', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#555' }}>
          <span style={{ fontWeight: 600 }}>목표 레벨 </span>
          <select
            value={targetLvIdx}
            onChange={(e) => setTargetLvIdx(Number(e.target.value))}
            style={{
              fontSize: 12, fontWeight: 700, border: '1.5px solid #E0E0E0',
              borderRadius: 8, padding: '2px 6px', background: '#fff', color: '#1A1A1A', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {TIER_LV_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>
          {lvData[targetLvIdx].achieved ? '달성!' : `${fmtMan(lvData[targetLvIdx].daily)}/일`}
        </div>
      </div>

      {/* 레벨별 목표 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DIR_TIERS.map((tier, idx) => {
          const d = lvData[idx];
          const isTarget = idx === targetLvIdx;
          const borderColor = d.achieved ? GREEN : isTarget ? ACCENT : '#E0E0E0';
          const bgColor = d.achieved
            ? 'linear-gradient(135deg, rgba(62,166,255,0.08), rgba(16,185,129,0.08))'
            : isTarget
            ? 'rgba(62,166,255,0.05)'
            : 'transparent';

          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                border: `${isTarget && !d.achieved ? 2 : 1}px solid ${borderColor}`,
                background: bgColor,
              }}
            >
              {/* 레벨 배지 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                {isTarget && !d.achieved && (
                  <div style={{ fontSize: 10, lineHeight: 1 }}>crown</div>
                )}
                <div style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                  background: d.achieved ? `linear-gradient(135deg, ${ACCENT}, ${GREEN})` : 'transparent',
                  border: `1.5px solid ${d.achieved ? GREEN : isTarget ? ACCENT : '#E0E0E0'}`,
                  color: d.achieved ? '#fff' : isTarget ? ACCENT : '#666',
                  whiteSpace: 'nowrap',
                }}>
                  {d.achieved ? '완료' : TIER_LV_NAMES[idx]}
                </div>
                {isTarget && !d.achieved && (
                  <div style={{ fontSize: 8, fontWeight: 800, color: ACCENT, letterSpacing: '-0.5px' }}>목표</div>
                )}
              </div>

              {/* 설명 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: d.achieved ? GREEN : '#555', lineHeight: 1.4 }}>
                  {tier.label} → {tier.rate}%
                </div>
                <div style={{ fontSize: 11, color: d.achieved ? GREEN : '#999', marginTop: 2 }}>
                  {d.achieved ? '달성 완료' : `하루 매출 ${fmtMan(d.daily)} 달성 시 가능`}
                </div>
              </div>

              {/* 인센티브 */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                  {fmtBigWon(Math.round(d.target * tier.rate / 100))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 메인 페이지 =====

export default function IncentiveDirectorPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<DirectorMonthlyEntry[]>([]);
  const [data, setData] = useState<MonthlySalesTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 월별 이력 초기 로드
  useEffect(() => {
    incentiveApi
      .get<DirectorMonthlyEntry[]>('/director/monthly')
      .then((res) => setMonthlyData(res.data ?? []))
      .catch(() => setMonthlyData([]));
  }, []);

  // 월 변경 시 데이터 로드
  const loadData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await incentiveApi.get<MonthlySalesTarget>(`/sales-target/${y}/${m}`);
      setData(res.data);
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
    value: m.totalRevenue ?? 0,
  }));

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const hasData =
    data != null &&
    data.lyTotal != null &&
    data.lyDays != null &&
    data.tysSales != null &&
    data.tyElapsed != null &&
    (data.lyDays ?? 0) > 0 &&
    (data.tyElapsed ?? 0) > 0;

  // 계산값
  const lyTotal = data?.lyTotal ?? 0;
  const tysSales = data?.tysSales ?? 0;
  const tyElapsed = data?.tyElapsed ?? 0;
  const tyRemain = data?.tyRemain ?? 0;
  const currentGrowth = lyTotal > 0 ? ((tysSales - lyTotal) / lyTotal) * 100 : 0;
  const currentTierIdx = getTierIdx(currentGrowth);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        .dir-select {
          padding: 10px 14px; font-size: 15px; font-weight: 700;
          font-family: inherit; color: #1A1A1A; background: #F9FAFB;
          border: 1.5px solid #E0E0E0; border-radius: 10px; cursor: pointer;
          appearance: none; outline: none;
        }
        .dir-select:focus { border-color: ${ACCENT}; }
        @keyframes dir-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* 이름 */}
      <div style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 16, letterSpacing: '-0.5px' }}>
        이정석
      </div>

      {/* 월 선택기 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          className="dir-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ flex: 1 }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select
          className="dir-select"
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
            animation: 'dir-spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13 }}>로딩 중...</div>
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>데이터 로드 실패</div>
          <div style={{ fontSize: 13 }}>잠시 후 다시 시도해주세요</div>
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && data && !hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chartData.length > 0 && <RevenueChart data={chartData} />}

          {(data.tyElapsed != null || data.tyRemain != null) && (
            <div style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 13, color: '#666', fontWeight: 600 }}>
              경과 {data.tyElapsed ?? '-'}일 / 남은 {data.tyRemain ?? '-'}일
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
              {year}년 {month}월 데이터 부족
            </div>
            <div style={{ fontSize: 13 }}>
              {[
                data.lyTotal == null ? '작년 매출' : null,
                data.tysSales == null ? '올해 매출' : null,
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

          {/* 총 매출 KPI */}
          <TotalRevenueCard value={tysSales} />

          {/* 차트 */}
          {chartData.length > 0 && <RevenueChart data={chartData} />}

          {/* 총 인센티브 */}
          <TotalIncentiveCard
            tysSales={tysSales}
            lyTotal={lyTotal}
            currentGrowth={currentGrowth}
            currentTierIdx={currentTierIdx}
          />

          {/* 매출 예측 */}
          <SalesForecastCard data={data} />

          {/* 오늘의 목표 */}
          <TodayGoalCard
            tysSales={tysSales}
            lyTotal={lyTotal}
            tyRemain={tyRemain}
          />
        </div>
      )}
    </div>
  );
}
