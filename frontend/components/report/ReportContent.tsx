'use client';

import { Eye, Phone, TrendingUp, Trophy, Lock, Star, BarChart2 } from 'lucide-react';
import StatCard from './StatCard';
import type { OwnerWeeklyReport } from '@/types';

interface ReportContentProps {
  report: OwnerWeeklyReport;
  mechanicName?: string;
  showLocked?: boolean;
  weekStart: string;
  weekEnd: string;
}

export default function ReportContent({
  report,
  mechanicName,
  showLocked = true,
  weekStart,
  weekEnd,
}: ReportContentProps) {
  return (
    <>
      {/* 정비소명 표시 (관리자/공개 페이지용) */}
      {mechanicName && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">정비소</p>
          <p className="text-base font-bold text-gray-900 leading-snug">{mechanicName}</p>
        </div>
      )}

      {/* 데이터 없음 */}
      {!report && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3">
          <BarChart2 size={40} className="text-gray-300" />
          <p className="text-sm text-gray-500">{weekStart} ~ {weekEnd} 데이터가 없습니다.</p>
        </div>
      )}

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
      {showLocked && (
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
      )}
    </>
  );
}
