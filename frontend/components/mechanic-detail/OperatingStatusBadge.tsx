'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { OperatingHours, HolidayInfo } from '@/types';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<string, string> = {
  mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일',
};

function getOperatingStatus(
  operatingHours?: OperatingHours | null,
  holidays?: HolidayInfo | null,
): { status: 'open' | 'closed' | 'unknown'; label: string; todayHours?: string } {
  if (!operatingHours) return { status: 'unknown', label: '정보 없음' };

  const now = new Date();
  const dayIndex = now.getDay();
  const dayKey = DAY_KEYS[dayIndex];

  const todaySchedule = operatingHours[dayKey];

  // 운영시간이 설정되어 있지 않은 날 → 휴무
  if (!todaySchedule) {
    return { status: 'closed', label: '오늘 휴무' };
  }

  // 운영시간이 설정되어 있으면 → 영업일 (holidays 무시, 운영시간이 최종 기준)

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todaySchedule.open.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const todayHours = `${todaySchedule.open} - ${todaySchedule.close}`;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { status: 'open', label: '영업중', todayHours };
  } else {
    return { status: 'closed', label: '영업 종료', todayHours };
  }
}

interface Props {
  operatingHours?: OperatingHours | null;
  holidays?: HolidayInfo | null;
}

export default function OperatingStatusBadge({ operatingHours, holidays }: Props) {
  const [showTable, setShowTable] = useState(false);
  const [result, setResult] = useState(getOperatingStatus(operatingHours, holidays));

  useEffect(() => {
    setResult(getOperatingStatus(operatingHours, holidays));
    const interval = setInterval(() => {
      setResult(getOperatingStatus(operatingHours, holidays));
    }, 60000);
    return () => clearInterval(interval);
  }, [operatingHours, holidays]);

  if (result.status === 'unknown') return null;

  const now = new Date();
  const todayKey = DAY_KEYS[now.getDay()];

  return (
    <div>
      <button
        onClick={() => setShowTable(!showTable)}
        className="flex items-center gap-2"
      >
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[var(--text-caption)] font-bold ${
            result.status === 'open'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              result.status === 'open' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          {result.label}
        </span>
        {result.todayHours && (
          <span className="text-[var(--text-caption)] text-text-muted">{result.todayHours}</span>
        )}
        {operatingHours && (
          showTable
            ? <ChevronUp size={14} className="text-text-muted" />
            : <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>

      {showTable && operatingHours && (
        <div className="mt-2 bg-bg-secondary rounded-xl p-3 space-y-1">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
            const schedule = operatingHours[day];
            const isToday = day === todayKey;
            return (
              <div
                key={day}
                className={`flex justify-between text-[var(--text-caption)] ${
                  isToday ? 'font-bold text-brand-500' : 'text-text-secondary'
                }`}
              >
                <span>{DAY_LABELS[day]}{isToday ? ' (오늘)' : ''}</span>
                <span>
                  {!schedule ? (
                    <span className="text-red-500">휴무</span>
                  ) : (
                    `${schedule.open} - ${schedule.close}`
                  )}
                </span>
              </div>
            );
          })}
          {holidays?.description && (
            <p className="text-[var(--text-small)] text-text-muted mt-1.5 pt-1.5 border-t border-[var(--border-light)]">
              {holidays.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
