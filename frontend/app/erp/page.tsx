'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Bell,
  DollarSign,
} from 'lucide-react';
import ErpLayout from '@/components/erp/ErpLayout';
import { erpApi } from '@/lib/erp-api';

// ------------------------------------------------------------------
// 타입 정의
// ------------------------------------------------------------------

interface DashboardData {
  today: { sales: number; transactionCount: number; date: string };
  month: { sales: number; transactionCount: number; customerCount: number; avgTicket: number };
  lastYear: { sales: number; period: string };
  yoyGrowthPct: number;
  totalVehicles: number;
  pendingReminders: number;
}

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

// ------------------------------------------------------------------
// 숫자 포매터
// ------------------------------------------------------------------

function formatWon(value: number): string {
  if (value >= 10000) {
    const man = Math.floor(value / 10000);
    return `${man.toLocaleString('ko-KR')}만원`;
  }
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

// ------------------------------------------------------------------
// 차트 컴포넌트 (SSR 비활성화)
// ------------------------------------------------------------------

interface DailySalesChartProps {
  data: DailySalesItem[];
}

function DailySalesChartInner({ data }: DailySalesChartProps) {
  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = require('recharts'); // eslint-disable-line @typescript-eslint/no-require-imports

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${Math.floor(v / 10000)}만`}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value: number) => [formatWon(value), '매출']}
          labelFormatter={(label: string) => `날짜: ${label}`}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
        />
        <Area
          type="monotone"
          dataKey="totalSales"
          stroke="#7C4DFF"
          strokeWidth={2}
          fill="url(#salesGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#7C4DFF' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: CategoryItem[];
}

const CHART_COLORS = ['#7C4DFF', '#9C74FF', '#B99DFF', '#D4C4FF', '#EDE6FF', '#C084FC', '#A855F7'];

function CategoryChartInner({ data }: CategoryChartProps) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
  } = require('recharts'); // eslint-disable-line @typescript-eslint/no-require-imports

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${Math.floor(v / 10000)}만`}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value: number) => [formatWon(value), '매출']}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
        />
        <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const DailySalesChart = dynamic(
  () => Promise.resolve(DailySalesChartInner),
  { ssr: false, loading: () => <Skeleton className="h-[220px]" /> }
);

const CategoryChart = dynamic(
  () => Promise.resolve(CategoryChartInner),
  { ssr: false, loading: () => <Skeleton className="h-[220px]" /> }
);

// ------------------------------------------------------------------
// 스켈레톤
// ------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className ?? ''}`} />
  );
}

// ------------------------------------------------------------------
// KPI 카드
// ------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  sub?: string;
}

function KpiCard({ title, value, icon, badge, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-purple-50 rounded-xl text-[#7C4DFF]">{icon}</div>
        {badge}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ------------------------------------------------------------------
// 메인 페이지
// ------------------------------------------------------------------

interface SyncStatus {
  lastSync?: string;
  message?: string;
}

export default function ErpDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    erpApi.getSyncStatus().then(res => setSyncStatus(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [dashRes, dailyRes, catRes, topRes] = await Promise.all([
          erpApi.getDashboard(),
          erpApi.getDailySales(),
          erpApi.getSalesByCategory(),
          erpApi.getTopProducts({ limit: 10 }),
        ]);
        setDashboard(dashRes.data);
        setDailySales(dailyRes.data.data ?? []);
        setCategories(catRes.data.data ?? []);
        setTopProducts(topRes.data.data ?? []);
      } catch (err) {
        console.error(err);
        setError('데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <ErpLayout>
      <div className="space-y-6">
        {/* 페이지 제목 */}
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>

        {/* PC 동기화 상태 */}
        {syncStatus?.lastSync && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>PC 동기화: {new Date(syncStatus.lastSync).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            {syncStatus.message && <span className="text-gray-400">({syncStatus.message})</span>}
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* KPI 카드 행 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </>
          ) : dashboard ? (
            <>
              <KpiCard
                title="오늘 매출"
                value={formatWon(dashboard.today.sales)}
                icon={<DollarSign size={20} />}
                sub={`거래 ${dashboard.today.transactionCount.toLocaleString('ko-KR')}건`}
              />
              <KpiCard
                title="이번달 매출"
                value={formatWon(dashboard.month.sales)}
                icon={<TrendingUp size={20} />}
                badge={
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
                      dashboard.yoyGrowthPct >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {dashboard.yoyGrowthPct >= 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {Math.abs(dashboard.yoyGrowthPct).toFixed(1)}%
                  </span>
                }
                sub="전년 동기 대비"
              />
              <KpiCard
                title="이번달 고객수"
                value={`${dashboard.month.customerCount.toLocaleString('ko-KR')}명`}
                icon={<Users size={20} />}
                sub={`평균 객단가 ${formatWon(dashboard.month.avgTicket)}`}
              />
              <KpiCard
                title="대기 리마인더"
                value={`${dashboard.pendingReminders.toLocaleString('ko-KR')}건`}
                icon={<Bell size={20} />}
                badge={
                  dashboard.pendingReminders > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                  ) : undefined
                }
                sub={`누적 차량 ${dashboard.totalVehicles.toLocaleString('ko-KR')}대`}
              />
            </>
          ) : null}
        </div>

        {/* 차트 행 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* 일별 매출 추이 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4">일별 매출 추이</h2>
            {loading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <DailySalesChart data={dailySales} />
            )}
          </div>

          {/* 카테고리별 매출 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4">카테고리별 매출</h2>
            {loading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <CategoryChart data={categories} />
            )}
          </div>
        </div>

        {/* 인기 상품 TOP 10 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} className="text-[#7C4DFF]" />
            <h2 className="text-base font-semibold text-gray-800">인기 상품 TOP 10</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400 w-8">#</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400">상품명</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-400">카테고리</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-400">매출</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-400">수량</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-400">거래</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr
                      key={product.productCode}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                              ? 'bg-gray-100 text-gray-600'
                              : index === 2
                              ? 'bg-orange-100 text-orange-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-400">{product.productCode}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-800">
                        {formatWon(product.revenue)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">
                        {product.qty.toLocaleString('ko-KR')}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">
                        {product.transactionCount.toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                        데이터가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ErpLayout>
  );
}
