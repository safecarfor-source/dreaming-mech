'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { GdVehicle, GdRepair } from '@/types/incentive';

const ACCENT = '#3EA6FF';

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

// ===== 정비이력 아코디언 =====

interface RepairDetailProps {
  code: string;
}

function RepairDetail({ code }: RepairDetailProps) {
  const [repairs, setRepairs] = useState<GdRepair[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await incentiveApi.get<{ repairs: GdRepair[]; total: number }>(
          `/gd/vehicle-repairs?code=${encodeURIComponent(code)}&page=1&limit=20`
        );
        if (!cancelled) {
          setRepairs(res.data.repairs || []);
          setTotal(res.data.total || 0);
          setPage(1);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [code]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await incentiveApi.get<{ repairs: GdRepair[]; total: number }>(
        `/gd/vehicle-repairs?code=${encodeURIComponent(code)}&page=${nextPage}&limit=20`
      );
      setRepairs((prev) => [...prev, ...(res.data.repairs || [])]);
      setPage(nextPage);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <div style={{ fontSize: 13, color: '#999', padding: '8px 0' }}>정비 이력 불러오는 중...</div>;
  }
  if (error) {
    return <div style={{ fontSize: 13, color: '#FF4E45', padding: '8px 0' }}>정비 이력 로드 실패</div>;
  }
  if (repairs.length === 0) {
    return <div style={{ fontSize: 13, color: '#999', padding: '8px 0' }}>정비 이력이 없습니다</div>;
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '80px 1fr 80px 70px',
        gap: 4, padding: '6px 0',
        fontSize: 11, fontWeight: 700, color: '#999',
        borderBottom: '1px solid #E0E0E0', marginBottom: 4,
      }}>
        <span>날짜</span>
        <span>품목</span>
        <span style={{ textAlign: 'right' }}>금액</span>
        <span style={{ textAlign: 'right' }}>주행</span>
      </div>

      {repairs.map((r, i) => {
        const d = r.repairDate ? r.repairDate.slice(0, 10).replace(/-/g, '.') : '-';
        return (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 80px 70px',
            gap: 4, padding: '6px 0',
            fontSize: 12, borderBottom: '1px solid #F5F5F5',
          }}>
            <span style={{ color: '#666' }}>{d}</span>
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.productName || '-'}
            </span>
            <span style={{ textAlign: 'right', color: '#1A1A1A' }}>
              {r.amount != null ? fmt(r.amount) + '원' : '-'}
            </span>
            <span style={{ textAlign: 'right', color: '#999' }}>
              {r.mileage != null ? fmt(r.mileage) + 'km' : '-'}
            </span>
          </div>
        );
      })}

      {repairs.length < total && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{
            width: '100%', marginTop: 8, padding: '8px',
            background: '#F5F5F5', border: 'none', borderRadius: 8,
            fontSize: 12, color: ACCENT, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loadingMore ? '불러오는 중...' : `더 보기 (${repairs.length}/${total})`}
        </button>
      )}
    </div>
  );
}

// ===== 차량 카드 =====

interface VehicleCardProps {
  vehicle: GdVehicle;
  isOpen: boolean;
  onToggle: () => void;
}

function VehicleCard({ vehicle: v, isOpen, onToggle }: VehicleCardProps) {
  const modelInfo = [v.carModel, v.color, v.modelYear ? v.modelYear + '년' : '']
    .filter(Boolean).join(' · ') || '-';

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${isOpen ? ACCENT : '#E8E8E8'}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      {/* 메인 정보 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center', padding: '14px 16px', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1, color: '#1A1A1A', marginBottom: 2 }}>
            {v.plateNumber || '-'}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{modelInfo}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{v.ownerName || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{v.phone || ''}</div>
        </div>
      </div>

      {/* 정비이력 (아코디언) */}
      {isOpen && (
        <div
          style={{ padding: '0 16px 14px', borderTop: `1px solid #F0F0F0` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ paddingTop: 12 }}>
            <RepairDetail code={v.code} />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 메인 페이지 =====

export default function GdVehiclePage() {
  const router = useRouter();
  const { user, isAuthenticated, isExpired } = useIncentiveAuthStore();

  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState<GdVehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState('검색어를 입력하세요');
  const [hasSearched, setHasSearched] = useState(false);
  const [openCode, setOpenCode] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 접근 권한 체크 (662 또는 admin)
  useEffect(() => {
    if (!isAuthenticated || isExpired()) {
      router.replace('/incentive/login');
      return;
    }
    const allowed = user?.loginId === '662' || user?.access.includes('admin');
    if (!allowed) {
      router.replace('/incentive/team');
    }
  }, [isAuthenticated, isExpired, user, router]);

  const search = useCallback(async (q: string, reset: boolean) => {
    if (!q.trim()) return;
    if (reset) {
      setVehicles([]);
      setPage(1);
      setOpenCode(null);
    }
    const currentPage = reset ? 1 : page;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setStatus('검색 중...');
    setHasSearched(true);

    try {
      const res = await incentiveApi.get<{ data: GdVehicle[]; total: number }>(
        `/gd/vehicles?q=${encodeURIComponent(q)}&page=${currentPage}&limit=20`
      );
      const items = res.data.data || [];
      const newTotal = res.data.total || 0;
      setTotal(newTotal);

      if (reset) {
        setVehicles(items);
      } else {
        setVehicles((prev) => [...prev, ...items]);
      }

      if (items.length === 0 && reset) {
        setStatus('검색 결과가 없습니다');
      } else {
        setStatus('');
      }

      if (!reset) setPage((p) => p + 1);
      else setPage(2);
    } catch {
      setStatus('조회 실패');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setVehicles([]);
      setHasSearched(false);
      setStatus('검색어를 입력하세요');
      return;
    }
    debounceRef.current = setTimeout(() => search(q, true), 300);
  }

  function handleClear() {
    setQuery('');
    setVehicles([]);
    setHasSearched(false);
    setStatus('검색어를 입력하세요');
    inputRef.current?.focus();
  }

  function handleToggle(code: string) {
    setOpenCode((prev) => prev === code ? null : code);
  }

  const allowed = user?.loginId === '662' || user?.access.includes('admin');
  if (!allowed) return null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gv-search-input:focus { border-color: ${ACCENT} !important; background: #fff !important; }
        .gv-clear-btn { opacity: 0; pointer-events: none; transition: opacity 0.15s; }
        .gv-clear-btn.show { opacity: 1; pointer-events: auto; }
      `}</style>

      {/* 검색창 전 스페이서 (검색 전에는 세로 중앙) */}
      {!hasSearched && (
        <div style={{ height: '30vh' }} />
      )}

      {/* 검색창 */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          ref={inputRef}
          className="gv-search-input"
          type="search"
          value={query}
          onChange={handleInput}
          placeholder="차량번호, 고객명, 전화번호"
          autoComplete="off"
          inputMode="search"
          style={{
            width: '100%',
            padding: '14px 44px 14px 16px',
            border: '1.5px solid #E0E0E0',
            borderRadius: 12,
            fontSize: 15,
            fontFamily: 'inherit',
            background: '#F5F5F5',
            color: '#1A1A1A',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          className={`gv-clear-btn${query ? ' show' : ''}`}
          onClick={handleClear}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: '#999', lineHeight: 1, padding: '4px',
          }}
          aria-label="지우기"
        >
          ×
        </button>
      </div>

      {/* 상태 메시지 */}
      {status && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#999', fontSize: 13 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 20, height: 20,
                border: `2px solid #EEE`,
                borderTopColor: ACCENT,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span>{status}</span>
            </div>
          ) : status}
        </div>
      )}

      {/* 차량 목록 */}
      {!loading && vehicles.length > 0 && (
        <div>
          {vehicles.map((v) => (
            <VehicleCard
              key={v.code || v.plateNumber}
              vehicle={v}
              isOpen={openCode === v.code}
              onToggle={() => handleToggle(v.code)}
            />
          ))}

          {vehicles.length < total && (
            <button
              onClick={() => search(query, false)}
              disabled={loadingMore}
              style={{
                width: '100%', padding: '12px',
                background: '#F5F5F5', border: 'none', borderRadius: 10,
                fontSize: 13, color: ACCENT, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', marginTop: 4,
              }}
            >
              {loadingMore ? '불러오는 중...' : `더 보기 (${vehicles.length}/${total})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
