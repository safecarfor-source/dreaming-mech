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
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-bg-secondary rounded-lg flex-shrink-0">
            <Phone size={14} className="text-text-tertiary" />
          </div>
          {revealed ? (
            <a
              href={`tel:${phone}`}
              className="text-[var(--text-body)] text-brand-500 font-medium hover:underline break-all"
            >
              {phone}
            </a>
          ) : (
            <div className="relative">
              <span
                style={{ filter: 'blur(8px)', transition: 'filter 0.3s ease' }}
                className="text-[var(--text-body)] text-brand-500 font-medium select-none"
              >
                {phone}
              </span>
              <button
                onClick={handleReveal}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="bg-brand-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm whitespace-nowrap">
                  터치하여 전화번호 확인
                </span>
              </button>
            </div>
          )}
        </div>
        {revealed && (
          <p className="text-xs text-green-600 mt-1 ml-8">전화번호가 확인되었습니다</p>
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
