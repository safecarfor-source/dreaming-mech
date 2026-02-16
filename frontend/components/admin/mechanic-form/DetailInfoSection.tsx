'use client';

import { Clock, Tag, Car, CreditCard, Calendar, BadgeCheck } from 'lucide-react';
import type { OperatingHours, HolidayInfo } from '@/types';

const DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

const PRESET_SPECIALTIES = [
  '엔진', '미션', '판금도색', '타이어/휠', '전기차', '수입차',
  '하체/서스펜션', '에어컨', '오디오/네비', '튜닝', '종합정비', '경정비',
];

const PRESET_PAYMENT_METHODS = ['현금', '카드', '계좌이체', '네이버페이', '카카오페이'];

const HOLIDAY_DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
  { key: 'public', label: '공휴일' },
];

interface DetailInfoSectionProps {
  formData: {
    operatingHours: OperatingHours | null;
    specialties: string[];
    isVerified: boolean;
    parkingAvailable: boolean | null;
    paymentMethods: string[];
    holidays: HolidayInfo | null;
  };
  onFieldChange: (field: string, value: any) => void;
  isAdmin?: boolean;
}

export default function DetailInfoSection({
  formData,
  onFieldChange,
  isAdmin = false,
}: DetailInfoSectionProps) {
  const hours = formData.operatingHours || {};
  const holidays = formData.holidays || { type: 'none' as const, days: [], description: '' };

  // 운영시간 변경
  const handleHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    const newHours = { ...hours };
    if (!newHours[day]) {
      newHours[day] = { open: '09:00', close: '18:00' };
    }
    newHours[day] = { ...newHours[day]!, [field]: value };
    onFieldChange('operatingHours', newHours);
  };

  const handleDayToggle = (day: string) => {
    const newHours = { ...hours };
    if (newHours[day]) {
      newHours[day] = null;
    } else {
      newHours[day] = { open: '09:00', close: '18:00' };
    }
    onFieldChange('operatingHours', newHours);
  };

  // 전문분야 토글
  const toggleSpecialty = (specialty: string) => {
    const current = formData.specialties || [];
    const newSpecialties = current.includes(specialty)
      ? current.filter((s) => s !== specialty)
      : [...current, specialty];
    onFieldChange('specialties', newSpecialties);
  };

  // 결제수단 토글
  const togglePayment = (method: string) => {
    const current = formData.paymentMethods || [];
    const newMethods = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    onFieldChange('paymentMethods', newMethods);
  };

  // 휴무일 요일 토글
  const toggleHolidayDay = (day: string) => {
    const currentDays = holidays.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    onFieldChange('holidays', { ...holidays, type: 'weekly' as const, days: newDays });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Clock className="text-purple-600" />
        상세 정보
      </h2>

      {/* 운영시간 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🕐 운영시간
        </label>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDayToggle(key)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                  hours[key]
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </button>
              {hours[key] ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours[key]?.open || '09:00'}
                    onChange={(e) => handleHoursChange(key, 'open', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="time"
                    value={hours[key]?.close || '18:00'}
                    onChange={(e) => handleHoursChange(key, 'close', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">휴무</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 전문 분야 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Tag className="inline w-4 h-4 mr-1" />
          전문 분야
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (formData.specialties || []).includes(specialty)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* YouTube 인증 배지 (관리자 전용) */}
      {isAdmin && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVerified || false}
              onChange={(e) => onFieldChange('isVerified', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <BadgeCheck className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-700">YouTube 인증 배지</span>
          </label>
        </div>
      )}

      {/* 주차 가능 여부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Car className="inline w-4 h-4 mr-1" />
          주차 가능 여부
        </label>
        <div className="flex gap-3">
          {[
            { value: true, label: '가능', emoji: '🅿️' },
            { value: false, label: '불가', emoji: '🚫' },
            { value: null, label: '미정', emoji: '❓' },
          ].map(({ value, label, emoji }) => (
            <button
              key={label}
              type="button"
              onClick={() => onFieldChange('parkingAvailable', value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.parkingAvailable === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* 결제 수단 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <CreditCard className="inline w-4 h-4 mr-1" />
          결제 수단
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => togglePayment(method)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (formData.paymentMethods || []).includes(method)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* 휴무일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="inline w-4 h-4 mr-1" />
          정기 휴무일
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {HOLIDAY_DAYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleHolidayDay(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (holidays.days || []).includes(key)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={holidays.description || ''}
          onChange={(e) =>
            onFieldChange('holidays', { ...holidays, type: 'weekly' as const, description: e.target.value })
          }
          placeholder="추가 휴무 안내 (예: 매월 첫째/셋째 토요일 휴무)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-sm text-gray-900"
        />
      </div>
    </div>
  );
}
