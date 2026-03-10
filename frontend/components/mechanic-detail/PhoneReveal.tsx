'use client';

import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import { gtagEvent } from '@/lib/gtag-events';

interface PhoneRevealProps {
  mechanicId: number;
  mechanicName: string;
  phone: string;
  variant: 'card' | 'modal';
  onReveal?: () => void;
}

export default function PhoneReveal({ mechanicId, mechanicName, phone, variant, onReveal }: PhoneRevealProps) {
  const storageKey = `phone-revealed-${mechanicId}`;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(storageKey);
      if (saved === 'true') {
        setRevealed(true);
      }
    }
  }, [storageKey]);

  const handleReveal = () => {
    setRevealed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
    mechanicsApi.recordPhoneReveal(mechanicId).catch(() => {});
    gtagEvent.mechanicPhoneReveal(mechanicId, mechanicName);
    onReveal?.();
  };

  if (variant === 'modal') {
    return (
      <div className="bg-bg-secondary rounded-2xl p-4 sm:p-5 text-center">
        <p className="text-xs text-text-tertiary mb-3">전화번호</p>
        {revealed ? (
          <div>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-2.5
                text-[22px] sm:text-[26px] font-bold text-brand-500 hover:text-brand-600
                transition-colors duration-[var(--duration-fast)]"
            >
              <Phone size={22} className="flex-shrink-0" />
              {phone}
            </a>
            <p className="text-xs text-green-600 mt-2.5">✅ 전화번호 확인 — 클릭 기록됨!</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center py-1">
            <span
              style={{ filter: 'blur(10px)', transition: 'filter 0.3s ease' }}
              className="text-[22px] sm:text-[26px] font-bold text-text-primary select-none"
            >
              {phone}
            </span>
            <button
              onClick={handleReveal}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-5 py-2.5
                rounded-full font-bold shadow-[var(--shadow-md)] whitespace-nowrap
                transition-colors duration-[var(--duration-fast)]">
                👆 터치하여 전화번호 확인
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // card variant
  if (revealed) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <Phone size={10} className="text-gray-400 flex-shrink-0" />
        <span className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">
          {phone}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 min-w-0"
      onClick={(e) => {
        e.stopPropagation();
        handleReveal();
      }}
    >
      <Phone size={10} className="text-brand-500 flex-shrink-0" />
      <span className="text-[10px] sm:text-[11px] text-brand-500 font-medium cursor-pointer">
        전화번호 확인
      </span>
    </div>
  );
}
