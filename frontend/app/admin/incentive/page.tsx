'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Tier {
  label: string;
  min: number;
  max: number;
  rate: number;
  color: string;
  bg: string;
}

const tiers: Tier[] = [
  { label: '5% 이상 하락', min: -999, max: -5, rate: 0.3, color: '#EF4444', bg: '#FEF2F2' },
  { label: '0~5% 하락', min: -5, max: 0, rate: 0.5, color: '#EF4444', bg: '#FEF2F2' },
  { label: '동일 ~ 5% 성장', min: 0, max: 5, rate: 0.6, color: '#6B7280', bg: '#F9FAFB' },
  { label: '5~8% 성장', min: 5, max: 8, rate: 0.7, color: '#6B7280', bg: '#F9FAFB' },
  { label: '8% 이상 성장', min: 8, max: 999, rate: 0.9, color: '#7C3AED', bg: '#EDE9FE' },
];

function getCurrentTierIndex(growthRate: number): number {
  if (growthRate <= -5) return 0;
  if (growthRate <= 0) return 1;
  if (growthRate <= 5) return 2;
  if (growthRate <= 8) return 3;
  return 4;
}

function formatMoney(val: number): string {
  if (Math.abs(val) >= 10000) {
    const uk = Math.floor(Math.abs(val) / 10000);
    const remainder = Math.abs(val) % 10000;
    const sign = val < 0 ? '-' : '';
    if (remainder === 0) return `${sign}${uk}억`;
    return `${sign}${uk}억 ${remainder.toLocaleString()}만`;
  }
  return `${val.toLocaleString()}만`;
}

function SectionLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2.5">
      <span>{emoji}</span> {text}
    </p>
  );
}

function TierCard({
  tier,
  sales,
  incentive,
  isCurrent,
  highlight,
}: {
  tier: Tier;
  sales: number;
  incentive: number;
  isCurrent?: boolean;
  highlight: 'current' | 'max' | 'none';
}) {
  const borderColor = highlight === 'current' ? tier.color : highlight === 'max' ? '#7C3AED' : '#F0F0F0';
  const bgColor = highlight === 'current' ? tier.bg : highlight === 'max' ? '#EDE9FE' : '#fff';

  return (
    <div className="rounded-[14px] p-4" style={{ background: bgColor, border: `2px solid ${borderColor}` }}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold text-white px-2.5 py-0.5 rounded-md"
            style={{ background: tier.color }}
          >
            배율 {tier.rate}%
          </span>
          <span className="text-sm font-semibold text-gray-700">{tier.label}</span>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">{isCurrent ? '현재 매출' : '목표 매출'}</p>
          <p className="text-[15px] font-semibold text-gray-500">{formatMoney(sales)}원</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 mb-0.5">월 인센티브</p>
          <p
            className="text-[26px] font-extrabold tracking-tight"
            style={{ color: highlight === 'max' ? '#7C3AED' : tier.color }}
          >
            {incentive.toLocaleString()}만원
          </p>
        </div>
      </div>
    </div>
  );
}

function InputCard({
  label,
  value,
  editing,
  inputVal,
  onEdit,
  onChange,
  onConfirm,
  accent,
}: {
  label: string;
  value: number;
  editing: boolean;
  inputVal: string;
  onEdit: () => void;
  onChange: (v: string) => void;
  onConfirm: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex-1 bg-white rounded-[10px] p-3 ${
        accent ? 'border-[1.5px] border-purple-600' : 'border border-gray-100'
      }`}
    >
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={inputVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-[15px] font-bold border border-gray-300 rounded-md px-1.5 py-1 outline-none"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          />
          <button
            onClick={onConfirm}
            className="text-[11px] bg-purple-600 text-white border-none rounded-md px-2 py-1.5 cursor-pointer font-semibold whitespace-nowrap"
          >
            확인
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p className={`text-[17px] font-bold ${accent ? 'text-purple-600' : 'text-gray-900'}`}>
            {value >= 10000 ? `${(value / 10000).toFixed(1)}억` : `${value.toLocaleString()}만`}
          </p>
          <button
            onClick={onEdit}
            className="text-[11px] text-gray-400 bg-gray-100 border-none rounded px-2 py-0.5 cursor-pointer"
          >
            수정
          </button>
        </div>
      )}
    </div>
  );
}

export default function IncentiveSimulatorPage() {
  const [lastYear, setLastYear] = useState(14000);
  const [thisMonth, setThisMonth] = useState(13500);
  const [editingLast, setEditingLast] = useState(false);
  const [editingThis, setEditingThis] = useState(false);
  const [inputLast, setInputLast] = useState('14000');
  const [inputThis, setInputThis] = useState('13500');

  const growthRate = lastYear > 0 ? ((thisMonth - lastYear) / lastYear) * 100 : 0;
  const currentIdx = getCurrentTierIndex(growthRate);
  const currentTier = tiers[currentIdx];
  const maxTier = tiers[4];

  const currentIncentive = Math.round(thisMonth * currentTier.rate * 0.01);
  const maxSales = Math.round(lastYear * 1.1);
  const maxIncentive = Math.round(maxSales * maxTier.rate * 0.01);
  const gap = maxIncentive - currentIncentive;

  const nextTier = currentIdx < 4 ? tiers[currentIdx + 1] : null;
  const nextThreshold = nextTier ? Math.round(lastYear * (1 + nextTier.min / 100)) : null;
  const nextGap = nextThreshold ? nextThreshold - thisMonth : 0;
  const tireCount = nextGap > 0 ? Math.ceil(nextGap / 50) : 0;

  return (
    <AdminLayout>
      <div className="max-w-[480px] mx-auto py-5 px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">이정석 부장 인센티브</h2>
        <p className="text-sm text-gray-400 mb-5">작년 동월 매출 기준 · 배율 5단계</p>

        {/* 입력 카드 */}
        <div className="flex gap-2.5 mb-5">
          <InputCard
            label="작년 동월 매출"
            value={lastYear}
            editing={editingLast}
            inputVal={inputLast}
            onEdit={() => {
              setInputLast(String(lastYear));
              setEditingLast(true);
            }}
            onChange={setInputLast}
            onConfirm={() => {
              const v = parseInt(inputLast);
              if (v > 0) setLastYear(v);
              setEditingLast(false);
            }}
          />
          <InputCard
            label="이번 달 매출"
            value={thisMonth}
            editing={editingThis}
            inputVal={inputThis}
            onEdit={() => {
              setInputThis(String(thisMonth));
              setEditingThis(true);
            }}
            onChange={setInputThis}
            onConfirm={() => {
              const v = parseInt(inputThis);
              if (v >= 0) setThisMonth(v);
              setEditingThis(false);
            }}
            accent
          />
        </div>

        {/* 성장률 뱃지 */}
        <div className="text-center mb-5">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full"
            style={{ background: currentTier.bg, color: currentTier.color }}
          >
            작년 대비 {growthRate >= 0 ? '+' : ''}
            {growthRate.toFixed(1)}%
          </span>
        </div>

        {/* 현재 구간 */}
        <SectionLabel emoji="📍" text="지금 받는 금액" />
        <TierCard tier={currentTier} sales={thisMonth} incentive={currentIncentive} isCurrent highlight="current" />

        {/* 다음 구간 넛지 */}
        {nextTier && nextGap > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-3.5 py-3 mt-2.5 mb-5">
            <p className="text-sm font-semibold text-amber-800">
              💡 다음 구간({nextTier.rate}%)까지{' '}
              <span className="text-amber-600 font-extrabold">{formatMoney(nextGap)}원</span> 남음
            </p>
            <p className="text-xs text-amber-700 mt-1">
              → 타이어 약 <strong>{tireCount}대</strong>만 더 잡으면 구간 돌파
            </p>
          </div>
        )}

        {/* MAX 구간 */}
        <SectionLabel emoji="🏆" text="노력하면 받을 수 있는 금액" />
        <TierCard tier={maxTier} sales={maxSales} incentive={maxIncentive} highlight="max" />

        {/* Gap 하이라이트 */}
        <div className="bg-purple-50 border-[1.5px] border-purple-600 rounded-[10px] px-4 py-3.5 mt-2.5 mb-5 text-center">
          <p className="text-xs text-purple-600 font-medium mb-1">지금 vs MAX 차이</p>
          <p className="text-2xl font-extrabold text-purple-600">+{gap.toLocaleString()}만원</p>
          <p className="text-xs text-purple-400 mt-1">매달 이만큼 더 받을 수 있습니다</p>
        </div>

        {/* 전체 배율표 */}
        <SectionLabel emoji="📊" text="전체 배율표" />
        {tiers.map((tier, i) => {
          const estSales =
            i === currentIdx
              ? thisMonth
              : i === 4
                ? maxSales
                : Math.round(lastYear * (1 + (tier.min + tier.max) / 2 / 100));
          const estIncentive = Math.round(estSales * tier.rate * 0.01);

          const isActive = i === currentIdx;
          const isMax = i === 4;

          return (
            <div
              key={i}
              className="flex items-center justify-between px-3.5 py-2.5 mb-1.5 rounded-[10px]"
              style={{
                background: isActive ? currentTier.bg : '#fff',
                border: isActive
                  ? `1.5px solid ${currentTier.color}`
                  : isMax
                    ? '1.5px solid #7C3AED'
                    : '1px solid #F0F0F0',
              }}
            >
              <div className="flex items-center gap-2">
                {isActive && <span className="text-xs">📍</span>}
                {isMax && !isActive && <span className="text-xs">🏆</span>}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ color: tier.color, background: tier.bg }}
                >
                  {tier.rate}%
                </span>
                <span className="text-sm text-gray-500">{tier.label}</span>
              </div>
              <span
                className="text-[15px] font-bold"
                style={{
                  color: isActive ? currentTier.color : isMax ? '#7C3AED' : '#888',
                }}
              >
                {estIncentive.toLocaleString()}만
              </span>
            </div>
          );
        })}

        <p className="text-[11px] text-gray-300 text-center mt-5">
          타이어 단가 50만원 기준 · 매출 입력 시 자동 계산
        </p>
      </div>
    </AdminLayout>
  );
}
