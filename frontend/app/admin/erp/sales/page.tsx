'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { erpApi } from '@/lib/api';

// recharts SSR 비활성화
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false });
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });

// 카테고리 색상 맵
const CATEGORY_COLORS: Record<string, string> = {
  타이어: '#7C4DFF',
  엔진오일: '#FF6B6B',
  브레이크: '#4ECDC4',
  밧데리: '#FFE66D',
  휠: '#95E1D3',
  얼라인먼트: '#F38181',
  기타: '#A0AEC0',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#A0AEC0';
}

// 날짜 유틸
function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getPresetRange(preset: 'this-month' | 'last-month' | '3months'): { from: string; to: string } {
  const now = new Date();
  const today = toDateString(now);

  if (preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateString(from), to: today };
  }
  if (preset === 'last-month') {
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 86400000);
    const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
    return { from: toDateString(firstOfLastMonth), to: toDateString(lastOfLastMonth) };
  }
  // 3months
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return { from: toDateString(from), to: today };
}

// 숫자 포맷
function formatKRW(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString('ko-KR');
}

function formatFull(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

// 타입 정의
interface DailySalesItem {
  date: string;
  totalSales: number;
  customerCount: number;
  transactionCount: number;
  avgTicket: number;
}

interface CategoryItem {
  category: string;
  sales: number;
  qty: number;
  count: number;
  pct: number;
}

interface TopProductItem {
  productCode: string;
  productName: string;
  category: string;
  revenue: number;
  qty: number;
  transactionCount: number;
}

interface DailySalesResponse {
  data: DailySalesItem[];
  meta: { from: string; to: string; totalSales: number };
}

interface CategoryResponse {
  data: CategoryItem[];
  meta: { from: string; to: string; totalSales: number };
}

interface TopProductsResponse {
  data: TopProductItem[];
  meta: { from: string; to: string; limit: number };
}

// Sub-nav 탭
const ERP_TABS = [
  { label: '대시보드', href: '/admin/erp' },
  { label: '고객관리', href: '/admin/erp/customers' },
  { label: '매출분석', href: '/admin/erp/sales' },
  { label: '리마인더', href: '/admin/erp/reminders' },
];

function ErpSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      {ERP_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              isActive
                ? 'bg-white border border-b-white border-gray-200 text-purple-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ErpSalesPage() {
  const initial = getPresetRange('this-month');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [activePreset, setActivePreset] = useState<'this-month' | 'last-month' | '3months' | null>('this-month');

  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (f: string, t: string) => {
    setLoading(true);
    try {
      const [dailyRes, categoryRes, topRes] = await Promise.all([
        erpApi.getDailySales({ from: f, to: t }),
        erpApi.getSalesByCategory({ from: f, to: t }),
        erpApi.getTopProducts({ from: f, to: t, limit: 10 }),
      ]);

      const daily = (dailyRes.data as unknown as DailySalesResponse);
      const category = (categoryRes.data as unknown as CategoryResponse);
      const top = (topRes.data as unknown as TopProductsResponse);

      setDailySales([...(daily.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)));
      setCategoryData(category.data ?? []);
      setTopProducts(top.data ?? []);
      setTotalSales(daily.meta?.totalSales ?? category.meta?.totalSales ?? 0);
    } catch (err) {
      console.error('ERP 매출 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(from, to);
  }, []);

  function applyPreset(preset: 'this-month' | 'last-month' | '3months') {
    const range = getPresetRange(preset);
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset);
    fetchAll(range.from, range.to);
  }

  function handleSearch() {
    setActivePreset(null);
    fetchAll(from, to);
  }

  // 요약 계산
  const dayCount = dailySales.length;
  const avgDailySales = dayCount > 0 ? Math.round(totalSales / dayCount) : 0;
  const topCategory = categoryData.length > 0
    ? categoryData.reduce((a, b) => (a.sales > b.sales ? a : b)).category
    : '-';

  // 차트용 일별 데이터 (날짜 오름차순)
  const chartDailySales = [...dailySales].sort((a, b) => a.date.localeCompare(b.date));

  // 커스텀 파이 라벨
  const renderPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, pct, category,
  }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number;
    pct: number; category: string;
  }) => {
    if (pct < 3) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${pct.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">ERP 매출 분석</h1>

        {/* Sub-nav */}
        <ErpSubNav />

        {/* 날짜 범위 선택 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* 프리셋 버튼 */}
            <div className="flex gap-2">
              {(['this-month', 'last-month', '3months'] as const).map((preset) => {
                const labels = { 'this-month': '이번달', 'last-month': '지난달', '3months': '최근 3개월' };
                return (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activePreset === preset
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />

            {/* 날짜 직접 입력 */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setActivePreset(null); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setActivePreset(null); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                조회
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">데이터 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI 요약 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">기간 총 매출</p>
                <p className="text-2xl font-bold text-gray-900">{formatFull(totalSales)}</p>
                <p className="text-xs text-gray-400 mt-1">{from} ~ {to}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">일 평균 매출</p>
                <p className="text-2xl font-bold text-gray-900">{formatFull(avgDailySales)}</p>
                <p className="text-xs text-gray-400 mt-1">{dayCount}일 기준</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">최다 매출 카테고리</p>
                <p className="text-2xl font-bold text-gray-900">{topCategory}</p>
                {categoryData.length > 0 && topCategory !== '-' && (
                  <p className="text-xs text-gray-400 mt-1">
                    {categoryData.find((c) => c.category === topCategory)?.pct.toFixed(1)}% 비중
                  </p>
                )}
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 일별 매출 바차트 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 mb-4">일별 매출 추이</h2>
                {chartDailySales.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터 없음</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartDailySales} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickFormatter={(v: string) => v.slice(5)}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickFormatter={(v: number) => formatKRW(v)}
                        width={48}
                      />
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [formatFull(Number(value)), '매출']}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        labelFormatter={(label: any) => `날짜: ${label}`}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="totalSales" fill="#7C4DFF" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* 카테고리별 파이차트 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 mb-4">카테고리별 매출 비율</h2>
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">데이터 없음</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="sales"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        labelLine={false}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={renderPieLabel as any}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                        ))}
                      </Pie>
                      <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: any) => [formatFull(Number(value)), name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 일별 매출 테이블 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">일별 매출 상세</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium">날짜</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">매출</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">고객수</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">거래수</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">객단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">데이터 없음</td>
                      </tr>
                    ) : (
                      dailySales.map((row) => (
                        <tr key={row.date} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3 text-gray-700 tabular-nums">{row.date}</td>
                          <td className="py-2.5 px-3 text-right text-gray-900 font-medium tabular-nums">
                            {formatFull(row.totalSales)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                            {row.customerCount.toLocaleString('ko-KR')}명
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                            {row.transactionCount.toLocaleString('ko-KR')}건
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                            {formatFull(row.avgTicket)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 인기 상품 TOP 10 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-800 mb-4">인기 상품 TOP 10</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium">순위</th>
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium">상품명</th>
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium">카테고리</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">매출</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">수량</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium">거래수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">데이터 없음</td>
                      </tr>
                    ) : (
                      topProducts.map((product, index) => (
                        <tr key={product.productCode} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0
                                ? 'bg-yellow-400 text-yellow-900'
                                : index === 1
                                ? 'bg-gray-300 text-gray-700'
                                : index === 2
                                ? 'bg-orange-300 text-orange-900'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-800 font-medium max-w-[200px] truncate">
                            {product.productName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(product.category) }}
                            >
                              {product.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-900 font-medium tabular-nums">
                            {formatFull(product.revenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                            {product.qty.toLocaleString('ko-KR')}개
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">
                            {product.transactionCount.toLocaleString('ko-KR')}건
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
