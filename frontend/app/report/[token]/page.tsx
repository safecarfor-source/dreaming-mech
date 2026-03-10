'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, BarChart2, AlertCircle } from 'lucide-react';
import { publicReportApi } from '@/lib/api';
import type { OwnerWeeklyReport } from '@/types';
import ReportContent from '@/components/report/ReportContent';
import SkeletonCard from '@/components/report/SkeletonCard';

// 현재 주의 월요일 구하기
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ISO 주차 문자열 계산 (YYYY-Www)
function getISOWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// "3월 3일 ~ 9일" 또는 "2월 26일 ~ 3월 4일" 형식
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mMonth = monday.getMonth() + 1;
  const mDate = monday.getDate();
  const sMonth = sunday.getMonth() + 1;
  const sDate = sunday.getDate();

  if (mMonth === sMonth) {
    return `${mMonth}월 ${mDate}일 ~ ${sDate}일`;
  }
  return `${mMonth}월 ${mDate}일 ~ ${sMonth}월 ${sDate}일`;
}

// Date → YYYY-MM-DD
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PublicReportPage() {
  const params = useParams();
  const token = String(params.token);

  const now = new Date();
  const [mondayDate, setMondayDate] = useState<Date>(() => getMonday(now));
  const [report, setReport] = useState<OwnerWeeklyReport | null>(null);
  const [mechanicName, setMechanicName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const period = getISOWeekString(mondayDate);
  const weekStart = toDateString(mondayDate);
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const weekEnd = toDateString(sundayDate);

  const currentMonday = getMonday(now);
  const isCurrentWeek = mondayDate.getTime() === currentMonday.getTime();

  const goPrev = () => {
    setMondayDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goNext = () => {
    if (isCurrentWeek) return;
    setMondayDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const fetchReport = useCallback(() => {
    setLoading(true);
    setError(false);
    publicReportApi
      .getByToken(token, period)
      .then((res) => {
        const data = res.data as OwnerWeeklyReport & { mechanicName?: string };
        setReport(data);
        if (data.mechanicName) {
          setMechanicName(data.mechanicName);
        }
      })
      .catch(() => {
        setReport(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [token, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7C4DFF] rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-none">꿈꾸는정비사</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">주간 리포트</p>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 토큰 에러 */}
        {error && (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={40} className="text-red-300" />
            <p className="text-base font-bold text-gray-700">링크가 만료되었거나 유효하지 않습니다.</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              공유 링크는 일정 기간 후 자동으로 만료됩니다.
              <br />
              담당자에게 새 링크를 요청해 주세요.
            </p>
          </div>
        )}

        {!error && (
          <>
            {/* 정비소명 + 주 선택 */}
            <div className="flex items-center justify-between">
              <div>
                {mechanicName && (
                  <p className="text-base font-bold text-gray-900">{mechanicName}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">주간 성과 리포트</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={goPrev}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  aria-label="이전 주"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium w-40 text-center text-gray-900">
                  {formatWeekRange(mondayDate)}
                </span>
                <button
                  onClick={goNext}
                  disabled={isCurrentWeek}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="다음 주"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 로딩 */}
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
                <p className="text-sm text-gray-500">{formatWeekRange(mondayDate)} 데이터가 없습니다.</p>
              </div>
            )}

            {/* 리포트 본문 — 공개 페이지는 잠금 섹션 숨김 */}
            {!loading && report && (
              <ReportContent
                report={report}
                weekStart={weekStart}
                weekEnd={weekEnd}
                showLocked={false}
              />
            )}
          </>
        )}

        {/* 푸터 */}
        <footer className="pt-4 pb-8 text-center">
          <p className="text-xs text-gray-400">
            꿈꾸는정비사 &middot; dreammechaniclab.com
          </p>
        </footer>
      </main>
    </div>
  );
}
