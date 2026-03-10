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
  // 유튜브 CTA (card variant, 모바일 only)
  youtubeUrl?: string;
  youtubeLongUrl?: string;
  onYoutubeClick?: (e: React.MouseEvent) => void;
}

export default function PhoneReveal({ mechanicId, mechanicName, phone, variant, onReveal, youtubeUrl, youtubeLongUrl, onYoutubeClick }: PhoneRevealProps) {
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
      <div className="bg-bg-secondary rounded-2xl p-5 sm:p-6 text-center">
        <Phone size={28} className="text-brand-500 mx-auto mb-2" />
        <p className="text-sm text-text-tertiary mb-3">전화번호</p>
        {revealed ? (
          <div>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-3
                text-[28px] sm:text-[34px] font-bold text-brand-500 hover:text-brand-600
                transition-colors duration-[var(--duration-fast)]"
            >
              {phone}
            </a>
            <p className="text-sm text-green-600 mt-3">✅ 전화번호 확인완료</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center py-2">
            <span
              style={{ filter: 'blur(12px)', transition: 'filter 0.3s ease' }}
              className="text-[28px] sm:text-[34px] font-bold text-text-primary select-none"
            >
              {phone}
            </span>
            <button
              onClick={handleReveal}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="bg-brand-500 hover:bg-brand-600 text-white text-base px-6 py-3
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
  // 유튜브 CTA 버튼 — 모바일+데스크톱 공통
  const youtubeCta = (youtubeUrl || youtubeLongUrl) ? (
    <button
      className="ml-auto flex-shrink-0"
      style={{
        background: '#ff4444',
        color: '#fff',
        fontSize: 9,
        fontWeight: 600,
        borderRadius: 4,
        padding: '2px 8px',
        lineHeight: '1.4',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onYoutubeClick?.(e);
      }}
    >
      ▶ 영상
    </button>
  ) : null;

  if (revealed) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <Phone size={10} className="text-gray-400 flex-shrink-0" />
        <span className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">
          {phone}
        </span>
        {youtubeCta}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <div
        className="flex items-center gap-1 min-w-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleReveal();
        }}
      >
        <Phone size={10} className="text-brand-500 flex-shrink-0" />
        <span className="text-[10px] sm:text-[11px] text-brand-500 font-medium">
          전화번호 확인
        </span>
      </div>
      {youtubeCta}
    </div>
  );
}
