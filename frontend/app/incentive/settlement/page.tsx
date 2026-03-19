'use client';

import { useEffect, useState } from 'react';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { TeamIncentiveData, ManagerIncentiveData, DirectorIncentiveData } from '@/types/incentive';

// ===== 상수 =====

const ACCENT = '#3EA6FF';
const GREEN = '#2BA640';
const RED = '#FF4E45';

// 2025년 월별 실제 매출 (전년도 기준)
const LAST_YEAR_REVENUE: Record<number, number> = {
  1: 141000000, 2: 119870650, 3: 141360490, 4: 152108207,
  5: 145727900, 6: 125293560, 7: 161988450, 8: 158435400,
  9: 167255850, 10: 183964700, 11: 175339060, 12: 212235800,
};

// 이정석 부장 성장률 티어
const DIR_TIERS = [
  { label: '0% 미만', min: -Infinity, max: 0, rate: 0.25, color: RED },
  { label: '0~5%', min: 0, max: 5, rate: 0.3, color: '#FFB020' },
  { label: '5~10%', min: 5, max: 10, rate: 0.35, color: ACCENT },
  { label: '10~15%', min: 10, max: 15, rate: 0.4, color: GREEN },
  { label: '15% 이상', min: 15, max: Infinity, rate: 0.5, color: GREEN },
];

const MECH_NAMES = [
  { name: '허원준', bank: '카뱅 3333-13-2836393' },
  { name: '유영광', bank: '국민 591902-01-355377' },
  { name: '김철환', bank: '기업 434-141245-01-017' },
  { name: '금호영', bank: '우리 1002-050-478596' },
  { name: '박승준', bank: '' },
];

// ===== 유틸 =====

function fmtWon(n: number): string {
  return Math.round(n).toLocaleString('ko-KR') + '원';
}

function extractMonthNum(monthStr: string): number {
  const m = monthStr.match(/(\d+)월/);
  return m ? parseInt(m[1]) : 0;
}

function getDirTierIdx(growthRate: number): number {
  for (let i = DIR_TIERS.length - 1; i >= 0; i--) {
    if (growthRate >= DIR_TIERS[i].min) return i;
  }
  return 0;
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
  marginBottom: 4,
  letterSpacing: '-0.3px',
};

const subTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#999999',
  marginBottom: 14,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #F0F0F0',
  color: '#444',
};

const tdNumStyle: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #F0F0F0',
  textAlign: 'right',
  fontWeight: 600,
};

// ===== 메인 페이지 =====

export default function SettlementPage() {
  const { user } = useIncentiveAuthStore();
  const [teamData, setTeamData] = useState<TeamIncentiveData | null>(null);
  const [mgrData, setMgrData] = useState<ManagerIncentiveData | null>(null);
  const [dirData, setDirData] = useState<DirectorIncentiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // admin 권한 체크
  const isAdmin = user?.role === 'admin' || user?.access?.includes('admin');

  useEffect(() => {
    if (!isAdmin) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [teamRes, mgrRes, dirRes] = await Promise.all([
          incentiveApi.get<TeamIncentiveData>('/team/current'),
          incentiveApi.get<ManagerIncentiveData>('/manager/current'),
          incentiveApi.get<DirectorIncentiveData>('/director/current'),
        ]);
        setTeamData(teamRes.data);
        setMgrData(mgrRes.data);
        setDirData(dirRes.data);
      } catch (e: unknown) {
        const err = e as { message?: string };
        setError(err.message || '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  // 권한 없음
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
        <div style={{ fontSize: 13, color: RED }}>월말결산 데이터 로드 실패: {error}</div>
      </div>
    );
  }

  if (!teamData || !mgrData || !dirData) return null;

  // ===== 이정석 부장 계산 =====
  const dirRevenue = dirData.totalRevenue || 0;
  const dirMonthNum = extractMonthNum(dirData.month || teamData.month || '');
  const dirLastYearRev = LAST_YEAR_REVENUE[dirMonthNum] || 140000000;
  const dirGrowthRate = dirLastYearRev > 0
    ? ((dirRevenue - dirLastYearRev) / dirLastYearRev) * 100
    : 0;
  const dirTierIdx = getDirTierIdx(dirGrowthRate);
  const dirCurTier = DIR_TIERS[dirTierIdx];
  const dirIncentiveCalc = Math.round(dirRevenue * dirCurTier.rate / 100);
  const dirExtras =
    (dirData.extras?.wiper?.incentive || 0) +
    (dirData.extras?.battery?.incentive || 0) +
    (dirData.extras?.acFilter?.incentive || 0);
  const dirTotalPay = dirIncentiveCalc + dirExtras;

  // ===== 기사 계산 =====
  const teamInc = teamData.incentive;
  const isLoss = teamInc.lost > 0;
  const perPerson = teamInc.calculated || 0;
  const perActual = teamInc.actual || 0;
  const perLost = perPerson - perActual;

  // ===== 합계 =====
  const totalPay = dirTotalPay + (mgrData.totalIncentive || 0) + (perActual * MECH_NAMES.length);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {/* 헤더 */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>
        월말결산
      </h2>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px', lineHeight: 1.6 }}>
        {teamData.month || '-'} · 직원별 인센티브 정리
      </p>

      {/* 이정석 부장 */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>이정석 부장</div>
        <div style={subTextStyle}>농협 172190-51-011452</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdStyle}>이번 달 매출</td>
              <td style={{ ...tdNumStyle, fontWeight: 700 }}>{fmtWon(dirRevenue)}</td>
            </tr>
            <tr>
              <td style={tdStyle}>작년 동월 매출</td>
              <td style={tdNumStyle}>{fmtWon(dirLastYearRev)}</td>
            </tr>
            <tr>
              <td style={tdStyle}>성장률</td>
              <td style={{ ...tdNumStyle, color: dirCurTier.color, fontWeight: 700 }}>
                {dirGrowthRate >= 0 ? '+' : ''}{dirGrowthRate.toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>적용 구간</td>
              <td style={{ ...tdNumStyle, fontWeight: 600 }}>
                {dirCurTier.label} ({dirCurTier.rate}%)
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>매출 인센티브</td>
              <td style={{ ...tdNumStyle, color: ACCENT, fontWeight: 700 }}>
                {fmtWon(dirIncentiveCalc)}
              </td>
            </tr>
            {dirExtras > 0 && (
              <tr>
                <td style={tdStyle}>품목 인센티브</td>
                <td style={{ ...tdNumStyle, color: ACCENT }}>{fmtWon(dirExtras)}</td>
              </tr>
            )}
            <tr style={{ borderTop: `2px solid #E0E0E0` }}>
              <td style={{ ...tdStyle, fontWeight: 800, borderBottom: 'none' }}>지급액</td>
              <td style={{
                ...tdNumStyle, fontWeight: 900, color: ACCENT,
                fontSize: 16, borderBottom: 'none',
              }}>
                {fmtWon(dirTotalPay)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 김권중 매니저 */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>김권중 매니저</div>
        <div style={subTextStyle}>기업 55503636801011</div>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdStyle}>타이어 매출</td>
              <td style={{ ...tdNumStyle, fontWeight: 600 }}>{fmtWon(mgrData.tireSales || 0)}</td>
            </tr>
            <tr>
              <td style={tdStyle}>얼라인먼트 매출</td>
              <td style={{ ...tdNumStyle, fontWeight: 600 }}>{fmtWon(mgrData.alignmentSales || 0)}</td>
            </tr>
            <tr style={{ fontWeight: 700, borderTop: '1px solid #E0E0E0' }}>
              <td style={tdStyle}>타이어+얼라인 매출</td>
              <td style={tdNumStyle}>
                {fmtWon((mgrData.tireSales || 0) + (mgrData.alignmentSales || 0))}
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>타이어 인센티브 (0.3%)</td>
              <td style={{ ...tdNumStyle, color: ACCENT }}>{fmtWon(mgrData.tireIncentive || 0)}</td>
            </tr>
            <tr>
              <td style={tdStyle}>팀 인센티브 × 1.5</td>
              <td style={{ ...tdNumStyle, color: ACCENT }}>{fmtWon(mgrData.teamBonus || 0)}</td>
            </tr>
            <tr style={{ borderTop: `2px solid #E0E0E0` }}>
              <td style={{ ...tdStyle, fontWeight: 800, borderBottom: 'none' }}>지급액</td>
              <td style={{
                ...tdNumStyle, fontWeight: 900, color: ACCENT,
                fontSize: 16, borderBottom: 'none',
              }}>
                {fmtWon(mgrData.totalIncentive || 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 기사 5명 */}
      <div style={cardStyle}>
        <div style={{ ...cardTitleStyle, marginBottom: 14 }}>기사 ({MECH_NAMES.length}명)</div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ ...tableStyle, minWidth: 340 }}>
            <thead>
              <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
                <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 700, color: '#666', fontSize: 12 }}>이름</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#666', fontSize: 12 }}>인센티브</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#666', fontSize: 12 }}>감액</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#666', fontSize: 12 }}>지급액</th>
              </tr>
            </thead>
            <tbody>
              {MECH_NAMES.map((m) => (
                <tr key={m.name}>
                  <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    {m.bank && (
                      <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{m.bank}</div>
                    )}
                  </td>
                  <td style={tdNumStyle}>{fmtWon(perPerson)}</td>
                  <td style={{ ...tdNumStyle, color: isLoss ? RED : GREEN }}>
                    {isLoss ? `-${fmtWon(perLost)}` : '-'}
                  </td>
                  <td style={{ ...tdNumStyle, fontWeight: 700, color: ACCENT }}>
                    {fmtWon(perActual)}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, borderTop: '2px solid #E0E0E0' }}>
                <td style={{ ...tdStyle, borderBottom: 'none' }}>소계</td>
                <td style={{ ...tdNumStyle, borderBottom: 'none' }}>
                  {fmtWon(perPerson * MECH_NAMES.length)}
                </td>
                <td style={{ ...tdNumStyle, color: RED, borderBottom: 'none' }}>
                  {isLoss ? `-${fmtWon(perLost * MECH_NAMES.length)}` : '-'}
                </td>
                <td style={{ ...tdNumStyle, color: ACCENT, borderBottom: 'none' }}>
                  {fmtWon(perActual * MECH_NAMES.length)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {isLoss && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: '#FEF2F2', borderRadius: 8,
            fontSize: 12, color: RED, fontWeight: 600,
          }}>
            최소수량 미달로 50% 감액 적용
          </div>
        )}
      </div>

      {/* 전체 합산 */}
      <div style={{
        ...cardStyle,
        border: `2px solid ${ACCENT}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>
              이번 달 총 인센티브 지급액
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {teamData.month || '-'}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT, letterSpacing: '-1px' }}>
            {fmtWon(totalPay)}
          </div>
        </div>
        <div style={{ marginTop: 12, borderTop: '1px solid #F0F0F0', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#666' }}>이정석 부장</span>
            <span style={{ fontWeight: 600 }}>{fmtWon(dirTotalPay)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#666' }}>김권중 매니저</span>
            <span style={{ fontWeight: 600 }}>{fmtWon(mgrData.totalIncentive || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#666' }}>기사 {MECH_NAMES.length}명</span>
            <span style={{ fontWeight: 600 }}>{fmtWon(perActual * MECH_NAMES.length)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
