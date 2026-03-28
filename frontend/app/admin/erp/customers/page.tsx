'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';
import { erpApi } from '@/lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Car,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Wrench,
} from 'lucide-react';

// recharts는 SSR 비활성화로 동적 임포트
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
const CartesianGrid = dynamic(
  () => import('recharts').then((m) => m.CartesianGrid),
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

// 타입 정의
interface CustomerSummary {
  code: string;
  plateNumber: string;
  ownerName: string;
  phone: string;
  carModel: string;
  modelYear: string;
  lastRepairDate: string;
  lastMileage: number;
  totalSpend: number;
  visitCount: number;
}

interface SearchMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RepairHistoryItem {
  id: number;
  repairDate: string;
  productCode: string;
  productName: string;
  qty: number;
  unitPrice: number;
  amount: number;
  mileage: number;
  memo: string | null;
}

interface MileagePoint {
  date: string;
  mileage: number;
}

interface CustomerDetail {
  vehicle: {
    code: string;
    plateNumber: string;
    ownerName: string;
    phone: string;
    carModel: string;
    carModel2: string | null;
    color: string;
    displacement: string;
    modelYear: string;
    purchaseDate: string | null;
    memo: string | null;
  };
  summary: {
    totalSpend: number;
    visitCount: number;
    firstVisitDate: string;
    lastVisitDate: string;
    lastMileage: number;
  };
  repairHistory: RepairHistoryItem[];
  mileageHistory: MileagePoint[];
  activeReminders: unknown[];
}

interface Prediction {
  dueDate?: string;
  dueMileage?: number;
  lastChangedDate?: string;
  lastChangedMileage?: number;
  basis: string;
}

interface PredictionData {
  vehicleCode: string;
  plateNumber: string;
  ownerName: string;
  carModel: string;
  lastVisitDate: string;
  lastMileage: number;
  avgKmPerMonth: number;
  estimatedCurrentMileage: number;
  predictions: {
    oilChange: Prediction;
    tireRotation: Prediction;
    inspection: Prediction;
  };
}

// ERP 서브 탭
const erpTabs = [
  { href: '/admin/erp', label: '대시보드' },
  { href: '/admin/erp/customers', label: '고객관리' },
  { href: '/admin/erp/sales', label: '매출분석' },
  { href: '/admin/erp/reminders', label: '리마인더' },
];

// 한국어 숫자 포맷
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

// 날짜 포맷
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dateStr.replace(/-/g, '.');
}

// 예측 날짜 색상 분류
function getPredictionStatus(dueDate: string | undefined): 'red' | 'orange' | 'green' | 'gray' {
  if (!dueDate) return 'gray';
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'red';
  if (diffDays <= 30) return 'orange';
  return 'green';
}

function statusStyle(status: 'red' | 'orange' | 'green' | 'gray') {
  switch (status) {
    case 'red':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'orange':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'green':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

function statusIcon(status: 'red' | 'orange' | 'green' | 'gray') {
  switch (status) {
    case 'red':
      return <AlertCircle size={14} className="text-red-500" />;
    case 'orange':
      return <Clock size={14} className="text-orange-500" />;
    case 'green':
      return <CheckCircle size={14} className="text-green-500" />;
    default:
      return <Clock size={14} className="text-gray-400" />;
  }
}

export default function ErpCustomersPage() {
  const pathname = usePathname();

  // 검색 상태
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // 데이터 상태
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 선택된 고객 상태
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 디바운스 처리
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // 고객 목록 검색
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await erpApi.searchCustomers({
        q: debouncedQuery || undefined,
        page,
        limit: LIMIT,
      });
      const body = res.data as { data: CustomerSummary[]; meta: SearchMeta };
      setCustomers(body.data ?? []);
      setMeta(body.meta ?? null);
    } catch {
      setError('고객 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 고객 상세 + 예측 조회
  const fetchDetail = useCallback(async (code: string) => {
    setDetailLoading(true);
    setDetail(null);
    setPrediction(null);
    try {
      const [detailRes, predRes] = await Promise.all([
        erpApi.getCustomerDetail(code),
        erpApi.predictNextVisit(code),
      ]);
      setDetail((detailRes.data as { data: CustomerDetail }).data);
      setPrediction((predRes.data as { data: PredictionData }).data);
    } catch {
      // 상세 조회 실패 시 조용히 처리
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectCustomer = (code: string) => {
    if (selectedCode === code) {
      setSelectedCode(null);
      setDetail(null);
      setPrediction(null);
      return;
    }
    setSelectedCode(code);
    fetchDetail(code);
  };

  return (
    <AdminLayout>
      {/* 서브 내비게이션 */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
        {erpTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#7C4DFF] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 페이지 제목 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">고객관리</h1>
        {meta && (
          <p className="text-sm text-gray-500 mt-1">
            전체 {formatNumber(meta.total)}명의 고객
          </p>
        )}
      </div>

      {/* 검색창 */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="차량번호, 고객명, 전화번호 검색..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition-colors"
        />
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 고객 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>차량번호</span>
          <span>차종</span>
          <span>고객명</span>
          <span>전화번호</span>
          <span>최근방문</span>
          <span className="text-right">총지출</span>
          <span className="text-right">방문횟수</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {debouncedQuery ? '검색 결과가 없습니다.' : '고객 데이터가 없습니다.'}
          </div>
        ) : (
          <div>
            {customers.map((c, idx) => {
              const isSelected = selectedCode === c.code;
              return (
                <div key={c.code}>
                  {/* 행 */}
                  <button
                    onClick={() => handleSelectCustomer(c.code)}
                    className={`w-full text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                      isSelected
                        ? 'bg-[#7C4DFF]/5'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    {/* 모바일 레이아웃 */}
                    <div className="md:hidden px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {c.plateNumber}
                            </span>
                            <span className="text-xs text-gray-400">{c.carModel}</span>
                          </div>
                          <div className="text-sm text-gray-700">{c.ownerName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{c.phone}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-[#7C4DFF]">
                            {formatKRW(c.totalSpend)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {c.visitCount}회 · {formatDate(c.lastRepairDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 데스크탑 레이아웃 */}
                    <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-4 items-center">
                      <span className="font-semibold text-gray-900 text-sm">
                        {c.plateNumber}
                      </span>
                      <span className="text-sm text-gray-600">
                        {c.carModel} {c.modelYear && `(${c.modelYear})`}
                      </span>
                      <span className="text-sm text-gray-800">{c.ownerName}</span>
                      <span className="text-sm text-gray-500">{c.phone}</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(c.lastRepairDate)}
                      </span>
                      <span className="text-sm text-right font-medium text-gray-800">
                        {formatKRW(c.totalSpend)}
                      </span>
                      <span className="text-sm text-right text-gray-500">
                        {formatNumber(c.visitCount)}회
                      </span>
                    </div>
                  </button>

                  {/* 상세 패널 (선택 시 하단 슬라이드) */}
                  {isSelected && (
                    <div className="border-b border-[#7C4DFF]/20 bg-white">
                      {detailLoading ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                          상세 정보를 불러오는 중...
                        </div>
                      ) : detail ? (
                        <DetailPanel detail={detail} prediction={prediction} />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {page} / {formatNumber(meta.totalPages)} 페이지
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// 상세 패널 컴포넌트
function DetailPanel({
  detail,
  prediction,
}: {
  detail: CustomerDetail;
  prediction: PredictionData | null;
}) {
  const { vehicle, summary, repairHistory, mileageHistory } = detail;

  const mileageChartData = mileageHistory.map((m) => ({
    date: m.date.slice(0, 7), // YYYY-MM
    mileage: m.mileage,
  }));

  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 좌측: 차량 정보 + 예측 */}
      <div className="space-y-4">
        {/* 차량/고객 정보 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Car size={16} className="text-[#7C4DFF]" />
            차량 및 고객 정보
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="차량번호" value={vehicle.plateNumber} />
            <InfoRow label="차종" value={`${vehicle.carModel}${vehicle.carModel2 ? ` / ${vehicle.carModel2}` : ''}`} />
            <InfoRow label="연식" value={vehicle.modelYear || '-'} />
            <InfoRow label="색상" value={vehicle.color || '-'} />
            <InfoRow label="배기량" value={vehicle.displacement ? `${vehicle.displacement}cc` : '-'} />
            <InfoRow
              label="구매일"
              value={vehicle.purchaseDate ? formatDate(vehicle.purchaseDate) : '-'}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <InfoRow
              label="고객명"
              icon={<User size={13} className="text-gray-400" />}
              value={vehicle.ownerName}
            />
            <InfoRow
              label="전화번호"
              icon={<Phone size={13} className="text-gray-400" />}
              value={vehicle.phone}
            />
          </div>
          {vehicle.memo && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400 block mb-1">메모</span>
              <p className="text-sm text-gray-700 leading-relaxed">{vehicle.memo}</p>
            </div>
          )}
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="총 지출"
            value={formatKRW(summary.totalSpend)}
            icon={<TrendingUp size={15} className="text-[#7C4DFF]" />}
          />
          <StatCard
            label="방문횟수"
            value={`${formatNumber(summary.visitCount)}회`}
            icon={<Wrench size={15} className="text-[#7C4DFF]" />}
          />
          <StatCard
            label="현재 주행"
            value={`${formatNumber(summary.lastMileage)}km`}
            icon={<Car size={15} className="text-[#7C4DFF]" />}
          />
        </div>

        {/* 다음 정비 예측 카드 */}
        {prediction && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#7C4DFF]" />
              다음 정비 예측
            </h3>
            <div className="space-y-3">
              <PredictionRow
                label="엔진오일 교환"
                pred={prediction.predictions.oilChange}
              />
              <PredictionRow
                label="타이어 로테이션"
                pred={prediction.predictions.tireRotation}
              />
              <PredictionRow
                label="차량 검사"
                pred={prediction.predictions.inspection}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              월 평균 주행거리: {formatNumber(prediction.avgKmPerMonth)}km ·
              현재 추정 주행거리: {formatNumber(prediction.estimatedCurrentMileage)}km
            </div>
          </div>
        )}
      </div>

      {/* 우측: 수리 이력 + 주행거리 차트 */}
      <div className="space-y-4">
        {/* 주행거리 추이 차트 */}
        {mileageChartData.length > 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#7C4DFF]" />
              주행거리 추이
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mileageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [
                      typeof value === 'number' ? `${formatNumber(value as number)}km` : '-',
                      '주행거리',
                    ]}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mileage"
                    stroke="#7C4DFF"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#7C4DFF' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 수리 이력 타임라인 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-[#7C4DFF]" />
            수리 이력
            <span className="ml-auto text-xs font-normal text-gray-400">
              최신순
            </span>
          </h3>

          {repairHistory.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">수리 이력이 없습니다.</p>
          ) : (
            <div className="relative">
              {/* 타임라인 세로선 */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#7C4DFF]/20" />
              <div className="space-y-4 pl-6">
                {repairHistory.map((item) => (
                  <div key={item.id} className="relative">
                    {/* 타임라인 닷 */}
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#7C4DFF] border-2 border-white shadow-sm shadow-[#7C4DFF]/30" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">
                          {formatDate(item.repairDate)}
                          {item.mileage ? ` · ${formatNumber(item.mileage)}km` : ''}
                        </p>
                        <p
                          className="text-sm text-gray-800 font-medium leading-snug overflow-hidden"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        >
                          {item.productName}
                        </p>
                        {item.memo && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                            {item.memo}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-semibold text-gray-700">
                          {formatKRW(item.amount)}
                        </span>
                        {item.qty > 1 && (
                          <p className="text-xs text-gray-400">
                            {formatKRW(item.unitPrice)} × {item.qty}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 보조 컴포넌트들
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-snug">{value}</p>
    </div>
  );
}

function PredictionRow({ label, pred }: { label: string; pred: Prediction }) {
  const status = getPredictionStatus(pred.dueDate);
  const style = statusStyle(status);
  const icon = statusIcon(status);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${style}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-0.5">{label}</p>
        <p className="text-xs opacity-80">
          {pred.dueDate ? `예정일: ${formatDate(pred.dueDate)}` : '날짜 정보 없음'}
          {pred.dueMileage ? ` · ${formatNumber(pred.dueMileage)}km` : ''}
        </p>
        <p className="text-xs opacity-60 mt-0.5">{pred.basis}</p>
      </div>
    </div>
  );
}
