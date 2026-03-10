'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, BarChart2, Link2, Check } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminReportApi } from '@/lib/api';
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

export default function AdminMechanicReportPage() {
  const params = useParams();
  const mechanicId = Number(params.mechanicId);

  const now = new Date();
  const [mondayDate, setMondayDate] = useState<Date>(() => getMonday(now));
  const [report, setReport] = useState<OwnerWeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [mechanicName, setMechanicName] = useState<string>('');
  const [sharing, setSharing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
    adminReportApi
      .getByMechanic(mechanicId, period)
      .then((res) => {
        const data = res.data as OwnerWeeklyReport & { mechanicName?: string };
        setReport(data);
        if (data.mechanicName) {
          setMechanicName(data.mechanicName);
        }
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [mechanicId, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGenerateShareLink = async () => {
    try {
      setSharing(true);
      const res = await adminReportApi.generateShareToken(mechanicId);
      const { token } = res.data;
      const shareUrl = `${window.location.origin}/report/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast('공유 링크가 클립보드에 복사되었습니다.');
    } catch {
      showToast('공유 링크 생성에 실패했습니다.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mechanicName ? `${mechanicName} 주간 리포트` : '주간 리포트'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">정비소 ID: {mechanicId}</p>
          </div>
          <button
            onClick={handleGenerateShareLink}
            disabled={sharing}
            className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6B3FE8] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Link2 size={16} />
            {sharing ? '생성 중...' : '공유 링크 생성'}
          </button>
        </div>

        {/* 주 선택 */}
        <div className="flex items-center gap-2">
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
            <p className="text-sm text-gray-500">{formatWeekRange(mondayDate)} 데이터가 없습니다.</p>
          </div>
        )}

        {/* 리포트 본문 */}
        {!loading && report && (
          <ReportContent
            report={report}
            mechanicName={mechanicName || undefined}
            weekStart={weekStart}
            weekEnd={weekEnd}
            showLocked={false}
          />
        )}
      </div>

      {/* 토스트 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-green-400 flex-shrink-0" />
          {toastMsg}
        </div>
      )}
    </AdminLayout>
  );
}
