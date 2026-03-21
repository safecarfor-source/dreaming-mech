'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { GdProduct } from '@/types/incentive';

const ACCENT = '#3EA6FF';
const GREEN = '#2BA640';

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

// ===== 상품 카드 =====

interface ProductCardProps {
  product: GdProduct;
  isOpen: boolean;
  onToggle: () => void;
}

function ProductCard({ product: p, isOpen, onToggle }: ProductCardProps) {
  const name = p.name || p.altName || '-';
  const price = p.sellPrice1 != null
    ? fmt(p.sellPrice1) + '원'
    : p.fixedPrice != null
    ? fmt(p.fixedPrice) + '원'
    : '-';
  const stock = p.stock ?? 0;
  const hasStock = stock > 0;

  return (
    <div
      style={{
        background: hasStock ? '#fff' : '#FAFAFA',
        border: `1px solid ${isOpen ? ACCENT : hasStock ? '#E8E8E8' : '#EEEEEE'}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: hasStock ? 1 : 0.75,
        transition: 'border-color 0.15s',
      }}
      onClick={onToggle}
    >
      {/* 메인 행 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center', padding: '14px 16px', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>
            {name}
          </div>
          {p.unit && (
            <div style={{ fontSize: 12, color: '#999' }}>{p.unit}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>{price}</div>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: hasStock ? GREEN : '#CCC',
          }}>
            {hasStock ? `재고 ${fmt(stock)}${p.unit || '개'}` : '재고 없음'}
          </div>
        </div>
      </div>

      {/* 상세 정보 (아코디언) */}
      {isOpen && (
        <div
          style={{ padding: '0 16px 14px', borderTop: '1px solid #F0F0F0' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            paddingTop: 12,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {/* 상품코드 */}
            <DetailItem label="상품코드" value={p.code || '-'} small />

            {/* 재고 */}
            <DetailItem
              label="재고"
              value={`${fmt(stock)}${p.unit || '개'}`}
              color={hasStock ? GREEN : '#CCC'}
            />

            {/* 원가 */}
            {p.costPrice != null && (
              <DetailItem label="원가" value={fmt(p.costPrice) + '원'} color="#999" />
            )}

            {/* 판매가 1~5 */}
            {[1, 2, 3, 4, 5].map((i) => {
              const v = p[`sellPrice${i}` as keyof GdProduct] as number | undefined;
              if (v == null) return null;
              return <DetailItem key={i} label={`판매가${i}`} value={fmt(v) + '원'} />;
            })}

            {/* 이름2 */}
            {p.altName && p.altName !== p.name && (
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailItem label="이름2" value={p.altName} small />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 13, fontWeight: 600, color: color || '#1A1A1A' }}>
        {value}
      </div>
    </div>
  );
}

// ===== 메인 페이지 =====

export default function GdProductPage() {
  const router = useRouter();
  const { user, isAuthenticated, isExpired } = useIncentiveAuthStore();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('tire');
  const [products, setProducts] = useState<GdProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState('검색어를 입력하세요');
  const [hasSearched, setHasSearched] = useState(false);
  const [openCode, setOpenCode] = useState<string | null>(null);

  const CATEGORIES = [
    { key: 'tire', label: '타이어' },
    { key: 'battery', label: '밧데리' },
    { key: 'lining', label: '라이닝' },
    { key: 'wiper', label: '와이퍼' },
    { key: '', label: '전체' },
  ];

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
      setProducts([]);
      setPage(1);
      setOpenCode(null);
    }
    const currentPage = reset ? 1 : page;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setStatus('검색 중...');
    setHasSearched(true);

    try {
      const catParam = category ? `&category=${category}` : '';
      const res = await incentiveApi.get<{ data: GdProduct[]; total: number }>(
        `/gd/products?q=${encodeURIComponent(q)}&page=${currentPage}&limit=20${catParam}`
      );
      const items = res.data.data || [];
      const newTotal = res.data.total || 0;
      setTotal(newTotal);

      // 재고순 정렬
      const sorted = [...items].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));

      if (reset) {
        setProducts(sorted);
      } else {
        setProducts((prev) => [...prev, ...sorted]);
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
  }, [page, category]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setProducts([]);
      setHasSearched(false);
      setStatus('검색어를 입력하세요');
      return;
    }
    debounceRef.current = setTimeout(() => search(q, true), 300);
  }

  function handleCategory(cat: string) {
    setCategory(cat);
    setProducts([]);
    setPage(1);
    setOpenCode(null);
    if (query.trim()) {
      setTimeout(() => search(query, true), 50);
    }
  }

  function handleClear() {
    setQuery('');
    setProducts([]);
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
        .gp-search-input:focus { border-color: ${ACCENT} !important; background: #fff !important; }
        .gp-clear-btn { opacity: 0; pointer-events: none; transition: opacity 0.15s; }
        .gp-clear-btn.show { opacity: 1; pointer-events: auto; }
      `}</style>

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 10,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => handleCategory(c.key)}
            style={{
              padding: '8px 16px', borderRadius: 20,
              border: 'none', fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: category === c.key ? ACCENT : '#F0F0F0',
              color: category === c.key ? '#fff' : '#666',
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 검색 전 스페이서 */}
      {!hasSearched && (
        <div style={{ height: '20vh' }} />
      )}

      {/* 검색창 */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          ref={inputRef}
          className="gp-search-input"
          type="search"
          value={query}
          onChange={handleInput}
          placeholder="상품명, 코드, 타이어사이즈(2355519)"
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
          className={`gp-clear-btn${query ? ' show' : ''}`}
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

      {/* 상품 목록 */}
      {!loading && products.length > 0 && (
        <div>
          {products.map((p) => (
            <ProductCard
              key={p.code}
              product={p}
              isOpen={openCode === p.code}
              onToggle={() => handleToggle(p.code)}
            />
          ))}

          {products.length < total && (
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
              {loadingMore ? '불러오는 중...' : `더 보기 (${products.length}/${total})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
