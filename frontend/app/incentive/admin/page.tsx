'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { IncentiveUser, ProductCodeMapping } from '@/types/incentive';

const ACCENT = '#3EA6FF';
const GREEN = '#2BA640';
const RED = '#FF4E45';

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

const CAT_LABELS: Record<string, string> = {
  ...ITEM_LABELS,
  tire: '타이어',
  alignment: '얼라이먼트',
};

interface CalcLog {
  id: number | string;
  editedAt: string;
  detail: string;
}

// ===== 공통 스타일 =====

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  border: '0.5px solid #E0E0E0',
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: `2px solid ${ACCENT}`,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #E0E0E0',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#F5F5F5',
  color: '#1A1A1A',
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: ACCENT,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
};

// ===== 계정 관리 섹션 =====

function AccountSection() {
  const [users, setUsers] = useState<IncentiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await incentiveApi.get<IncentiveUser[]>('/users');
      setUsers(res.data);
    } catch {
      setError('계정 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleResetPw(userId: number | string | undefined, name: string) {
    const newPw = window.prompt(`${name}의 새 비밀번호를 입력하세요:`);
    if (!newPw) return;
    try {
      await incentiveApi.put(`/users/${userId}`, { password: newPw });
      alert(`${name}의 비밀번호가 변경되었습니다.`);
      load();
    } catch {
      alert('변경 실패');
    }
  }

  const roleLabels: Record<string, string> = { admin: '관리자', manager: '매니저', director: '부장', viewer: '공용' };
  const PIN_MAP: Record<string, string> = { kkj: '0000', ljs: '1111' };

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>계정 관리</div>
      {loading && <div style={{ color: '#999', fontSize: 13 }}>로딩 중...</div>}
      {error && <div style={{ color: RED, fontSize: 13 }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                {['이름', '아이디', '비밀번호', 'PIN', '역할', '작업'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#666', borderBottom: '1px solid #E0E0E0', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.loginId} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '10px' }}>
                    <code style={{ background: '#E0E0E0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{u.loginId}</code>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <code style={{ background: '#FFF9E6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      {u.plainPassword || '(미설정)'}
                    </code>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <code style={{ background: '#E3F2FD', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      {PIN_MAP[u.loginId] || '-'}
                    </code>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: u.role === 'admin' ? '#EBF5FF' : u.role === 'director' ? '#F0FFF4' : '#F0F0F0',
                      color: u.role === 'admin' ? ACCENT : u.role === 'director' ? GREEN : '#666',
                    }}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {u.loginId === 'sjy' && (
                      <button
                        style={btnStyle}
                        onClick={() => handleResetPw(u.id, u.name)}
                      >
                        비번 변경
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== 계산 이력 섹션 =====

function CalcHistorySection() {
  const [logs, setLogs] = useState<CalcLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalcMsg, setRecalcMsg] = useState('');
  const [recalcLoading, setRecalcLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incentiveApi.get<CalcLog[]>('/auto-calc/status');
      setLogs(res.data.slice(0, 10));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleManualRecalc() {
    setRecalcLoading(true);
    setRecalcMsg('재계산 중...');
    try {
      const res = await incentiveApi.post<{ skipped?: boolean; repairCount?: number; totalRevenue?: number }>('/auto-calc/manual', {});
      if (res.data.skipped) {
        setRecalcMsg('해당 월 정비이력이 없습니다');
      } else {
        setRecalcMsg(`재계산 완료! 정비 ${(res.data.repairCount ?? 0).toLocaleString()}건 | 총매출 ${(res.data.totalRevenue ?? 0).toLocaleString()}원`);
        load();
      }
    } catch {
      setRecalcMsg('재계산 실패');
    } finally {
      setRecalcLoading(false);
    }
  }

  function fmtTime(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>계산 이력</div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        극동 데이터 동기화 시 자동으로 인센티브가 계산됩니다
      </p>

      {/* 수동 재계산 */}
      <button
        style={{ ...btnStyle, width: '100%', padding: '10px', marginBottom: 8 }}
        onClick={handleManualRecalc}
        disabled={recalcLoading}
      >
        {recalcLoading ? '재계산 중...' : '수동 재계산'}
      </button>
      {recalcMsg && (
        <div style={{ fontSize: 13, marginBottom: 12, color: recalcMsg.includes('완료') ? GREEN : RED }}>
          {recalcMsg}
        </div>
      )}

      {/* 최근 10건 */}
      {loading && <div style={{ color: '#999', fontSize: 13 }}>로딩 중...</div>}
      {!loading && logs.length === 0 && (
        <p style={{ fontSize: 13, color: '#999' }}>이력 없음</p>
      )}
      {!loading && logs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                {['일시', '정비 건수', '총매출'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#666', borderBottom: '1px solid #E0E0E0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                let detail: { repairCount?: number; totalRevenue?: number } = {};
                try { detail = JSON.parse(log.detail || '{}'); } catch { /* ignore */ }
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '10px' }}>{fmtTime(log.editedAt)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {(detail.repairCount ?? 0).toLocaleString()}건
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      {(detail.totalRevenue ?? 0).toLocaleString()}원
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

// ===== 상품코드 매핑 섹션 =====

const CATEGORY_OPTIONS = [
  { value: 'tire', label: '타이어' },
  { value: 'alignment', label: '얼라이먼트' },
  { value: 'brake_oil', label: '브레이크오일' },
  { value: 'lining', label: '라이닝' },
  { value: 'mission_oil', label: '미션오일' },
  { value: 'diff_oil', label: '데후오일' },
  { value: 'wiper', label: '와이퍼' },
  { value: 'battery', label: '밧데리' },
  { value: 'ac_filter', label: '에어컨필터' },
  { value: 'guardian_h3', label: '가디안H3' },
  { value: 'guardian_h5', label: '가디안H5' },
  { value: 'guardian_h7', label: '가디안H7' },
];

function MappingSection() {
  const [mappings, setMappings] = useState<ProductCodeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isPrefix, setIsPrefix] = useState(false);
  const [isIncentive, setIsIncentive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incentiveApi.get<ProductCodeMapping[]>('/mapping');
      setMappings(res.data);
    } catch {
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!newCode.trim() || !newCategory) {
      alert('상품코드와 카테고리를 입력하세요');
      return;
    }
    const label = CAT_LABELS[newCategory] || newCategory;
    try {
      await incentiveApi.post('/mapping', { code: newCode.trim(), isPrefix, category: newCategory, label, isIncentive });
      setNewCode('');
      load();
    } catch {
      alert('매핑 추가 실패');
    }
  }

  async function handleDelete(id: string | number, code: string) {
    if (!window.confirm(`매핑 "${code}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await incentiveApi.delete(`/mapping/${id}`);
      load();
    } catch {
      alert('삭제 실패');
    }
  }

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>상품 코드 매핑</div>

      {/* 매핑 테이블 */}
      {loading && <div style={{ color: '#999', fontSize: 13, marginBottom: 12 }}>로딩 중...</div>}
      {!loading && mappings.length === 0 && (
        <p style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>등록된 매핑 없음</p>
      )}
      {!loading && mappings.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                {['코드', '매칭방식', '카테고리', '인센티브', '작업'].map((h) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#666', borderBottom: '1px solid #E0E0E0', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '8px' }}>
                    <code style={{ background: '#E0E0E0', padding: '2px 6px', borderRadius: 4 }}>{m.code}</code>
                  </td>
                  <td style={{ padding: '8px', fontSize: 11 }}>{m.isPrefix ? '접두어' : '정확'}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      background: m.isIncentive ? '#EBF5FF' : '#F0F0F0',
                      color: m.isIncentive ? '#2563EB' : '#999',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>
                      {CAT_LABELS[m.category] || m.category}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{ color: m.isIncentive ? GREEN : '#CCC' }}>
                      {m.isIncentive ? 'O' : '-'}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      style={{ ...btnStyle, background: '#FF6B6B', fontSize: 11, padding: '3px 8px' }}
                      onClick={() => handleDelete(m.id, m.code)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>총 {mappings.length}개 매핑</p>
        </div>
      )}

      {/* 새 매핑 추가 */}
      <div style={{ padding: 16, background: '#F9F5FF', borderRadius: 8, border: '1px solid #E0E0E0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>새 매핑 추가</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input
            style={inputStyle}
            placeholder="상품코드"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="">카테고리 선택</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPrefix} onChange={(e) => setIsPrefix(e.target.checked)} />
            접두어 매칭
          </label>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={isIncentive} onChange={(e) => setIsIncentive(e.target.checked)} />
            인센티브 대상
          </label>
          <button style={{ ...btnStyle, marginLeft: 'auto' }} onClick={handleAdd}>
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 최소수량 목표 설정 섹션 =====

function getRecentMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yy = String(d.getFullYear()).slice(2);
    const mm = d.getMonth() + 1;
    months.push(`${yy}년 ${mm}월`);
  }
  return months;
}

const TARGET_ITEMS = Object.entries(ITEM_LABELS);

function TargetSection() {
  const monthOptions = getRecentMonths(6);
  const [month, setMonth] = useState(monthOptions[0]);
  const [targets, setTargets] = useState<Record<string, number>>(() =>
    Object.fromEntries(TARGET_ITEMS.map(([k]) => [k, 0]))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await incentiveApi.get<Record<string, number>>('/team/targets', { params: { month: m } });
      const data = res.data ?? {};
      setTargets(Object.fromEntries(TARGET_ITEMS.map(([k]) => [k, data[k] ?? 0])));
    } catch {
      setTargets(Object.fromEntries(TARGET_ITEMS.map(([k]) => [k, 0])));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [load, month]);

  async function handleSave() {
    setSaving(true);
    setMsg('');
    try {
      await incentiveApi.post('/team/targets', { month, targets });
      setMsg('저장 완료!');
    } catch {
      setMsg('저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>최소수량 목표 설정</div>

      {/* 월 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>대상 월</span>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* 품목 입력 그리드 */}
      {loading ? (
        <div style={{ color: '#999', fontSize: 13, marginBottom: 12 }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
          {TARGET_ITEMS.map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#333', whiteSpace: 'nowrap' }}>{label}</span>
              <input
                type="number"
                min="0"
                style={{ ...inputStyle, width: 60, textAlign: 'right', padding: '6px 8px' }}
                value={targets[key] ?? 0}
                onChange={(e) => setTargets((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      )}

      {/* 저장 버튼 + 메시지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          style={{ ...btnStyle, background: GREEN }}
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: msg.includes('완료') ? GREEN : '#FF4E45' }}>
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}

// ===== 메인 페이지 =====

export default function IncentiveAdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isExpired } = useIncentiveAuthStore();

  // admin 권한 체크
  useEffect(() => {
    if (!isAuthenticated || isExpired()) {
      router.replace('/incentive/login');
      return;
    }
    if (!user?.access.includes('admin')) {
      router.replace('/incentive/team');
    }
  }, [isAuthenticated, isExpired, user, router]);

  if (!user?.access.includes('admin')) return null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* 계정 관리 */}
      <AccountSection />

      {/* 계산 이력 */}
      <CalcHistorySection />

      {/* 최소수량 설정 */}
      <TargetSection />
    </div>
  );
}
