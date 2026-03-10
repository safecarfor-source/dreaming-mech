'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  Phone,
  TrendingUp,
  Trophy,
  Lock,
  Star,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerReportApi } from '@/lib/api';
import type { OwnerMonthlyReport } from '@/types';

// 통계 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  delta,
  colorClass,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={`${bgClass} rounded-xl p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      {delta !== undefined && delta !== null && (
        <p className={`text-xs font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% 전월 대비
        </p>
      )}
    </div>
  );
}

// 스켈레톤 카드 컴포넌트
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
  );
}

export default function OwnerReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<OwnerMonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const period = `${year}-${String(month).padStart(2, '0')}`;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    setLoading(true);
    ownerReportApi
      .getMonthlyReport(period)
      .then((res) => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* 헤더 + 월 선택 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">월간 리포트</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium w-28 text-center text-gray-900">
              {year}년 {month}월
            </span>
            <button
              onClick={goNext}
              disabled={isCurrentMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
            </div>
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-20" />
            <SkeletonCard className="h-28" />
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !report && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3">
            <BarChart2 size={40} className="text-gray-300" />
            <p className="text-sm text-gray-500">{year}년 {month}월 데이터가 없습니다.</p>
          </div>
        )}

        {/* 리포트 본문 */}
        {!loading && report && (
          <>
            {/* 3 통계 카드 */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Eye size={14} className="text-blue-500" />}
                label="조회수"
                value={report.totals.pageViews.toLocaleString()}
                delta={report.previousMonth.pageViewsDelta}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
              />
              <StatCard
                icon={<Phone size={14} className="text-green-500" />}
                label="전화확인"
                value={report.totals.phoneReveals.toLocaleString()}
                delta={report.previousMonth.phoneRevealsDelta}
                colorClass="text-green-600"
                bgClass="bg-green-50"
              />
              <StatCard
                icon={<TrendingUp size={14} className="text-[#7C4DFF]" />}
                label="전환율"
                value={`${report.totals.conversionRate.toFixed(1)}%`}
                colorClass="text-[#7C4DFF]"
                bgClass="bg-purple-50"
              />
            </div>

            {/* 일별 조회수 바 차트 */}
            {report.dailyViews && report.dailyViews.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">일별 조회수</h3>
                <div className="flex items-end gap-[2px] h-24">
                  {report.dailyViews.map((day) => {
                    const maxViews = Math.max(...report.dailyViews.map((d) => d.views));
                    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                    return (
                      <div key={day.date} className="flex-1 group relative">
                        <div
                          className="bg-blue-400 hover:bg-blue-500 rounded-t-sm transition-colors w-full"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {day.date.slice(5)}: {day.views}회
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 지역 순위 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Trophy size={20} className="text-[#7C4DFF]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">내 지역 순위</p>
                  <p className="text-lg font-bold text-gray-900">
                    {report.regionRanking.region} {report.regionRanking.total}개 중{' '}
                    <span className="text-[#7C4DFF]">{report.regionRanking.rank}위</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 프리미엄 정비소 비교 (앰버 박스) */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-amber-800">프리미엄 정비소 비교</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="text-gray-600">프리미엄 평균</p>
                  <p className="text-lg font-bold text-amber-700">
                    {report.premiumComparison.avgPhoneReveals}회
                  </p>
                </div>
                <div className="text-gray-300">|</div>
                <div>
                  <p className="text-gray-600">내 정비소</p>
                  <p className="text-lg font-bold text-gray-700">
                    {report.premiumComparison.myPhoneReveals}회
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-3">
                → 영상이 있는 정비소는 평균{' '}
                <strong>{report.premiumComparison.multiplier.toFixed(1)}배</strong> 더 많은 문의를 받습니다
              </p>
            </div>

            {/* 잠긴 프리미엄 섹션 */}
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 overflow-hidden">
              {/* 블러 처리된 가짜 콘텐츠 */}
              <div className="filter blur-[4px] opacity-50 pointer-events-none">
                <h3 className="text-sm font-bold text-gray-700 mb-3">프리미엄 리포트</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>• 유입 검색어 TOP 5</li>
                  <li>• 시간대별 조회 패턴</li>
                  <li>• 경쟁 정비소 비교 분석</li>
                  <li>• 월간 상세 PDF 리포트</li>
                </ul>
              </div>
              {/* 잠금 오버레이 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                <Lock size={28} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600 mb-3">프리미엄 전용 리포트</p>
                <button className="bg-[#7C4DFF] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#6B3FE8] transition-colors shadow-sm">
                  프리미엄 전환 문의 →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}
