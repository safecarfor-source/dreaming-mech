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
  const dayIndex = now.getDay(); // 0=Sun, 1=Mon, ...
  const dayKey = DAY_KEYS[dayIndex];

  // 휴무일 체크
  if (holidays?.type === 'weekly' && holidays.days?.includes(dayKey)) {
    return { status: 'closed', label: '오늘 휴무' };
  }

  const todaySchedule = operatingHours[dayKey];
  if (!todaySchedule) {
    return { status: 'closed', label: '오늘 휴무' };
  }

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

  // Update every minute
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
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
            result.status === 'open'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              result.status === 'open' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {result.label}
        </span>
        {result.todayHours && (
          <span className="text-sm text-gray-500">{result.todayHours}</span>
        )}
        {operatingHours && (
          showTable ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {/* 운영시간 테이블 */}
      {showTable && operatingHours && (
        <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-1.5">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
            const schedule = operatingHours[day];
            const isToday = day === todayKey;
            const isHoliday = holidays?.type === 'weekly' && holidays.days?.includes(day);

            return (
              <div
                key={day}
                className={`flex justify-between text-sm ${
                  isToday ? 'font-bold text-[#7C4DFF]' : 'text-gray-600'
                }`}
              >
                <span>{DAY_LABELS[day]}{isToday ? ' (오늘)' : ''}</span>
                <span>
                  {isHoliday || !schedule ? (
                    <span className="text-red-500">휴무</span>
                  ) : (
                    `${schedule.open} - ${schedule.close}`
                  )}
                </span>
              </div>
            );
          })}
          {holidays?.description && (
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
              {holidays.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
