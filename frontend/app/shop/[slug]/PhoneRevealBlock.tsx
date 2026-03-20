'use client';

import { useState, useEffect } from 'react';
import { mechanicsApi } from '@/lib/api';
import { gtagEvent } from '@/lib/gtag-events';

interface Props {
  mechanicId: number;
  mechanicName: string;
  phone: string;
}

export default function PhoneRevealBlock({ mechanicId, mechanicName, phone }: Props) {
  const storageKey = `phone-revealed-${mechanicId}`;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRevealed(sessionStorage.getItem(storageKey) === 'true');
    }
  }, [storageKey]);

  const handleReveal = () => {
    setRevealed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
    mechanicsApi.recordPhoneReveal(mechanicId).catch(() => {});
    gtagEvent.mechanicPhoneReveal(mechanicId, mechanicName);
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-7 text-center">
      <div className="text-4xl mb-3 text-[#7C4DFF]">📞</div>
      <p className="text-[16px] text-gray-500 mb-4">전화번호</p>
      {revealed ? (
        <div>
          <a
            href={`tel:${phone}`}
            className="text-[36px] font-black text-[#7C4DFF] tracking-wider hover:text-[#6D3FE0] transition-colors"
          >
            {phone}
          </a>
          <p className="text-[14px] text-green-600 mt-2 font-medium">✅ 전화번호 확인완료</p>
        </div>
      ) : (
        <div className="relative flex items-center justify-center py-2">
          <span
            className="text-[36px] font-black text-gray-800 select-none"
            style={{ filter: 'blur(12px)' }}
          >
            {phone}
          </span>
          <button
            onClick={handleReveal}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="bg-[#7C4DFF] hover:bg-[#6D3FE0] text-white text-[18px] font-bold
              px-8 py-4 rounded-full shadow-md transition-colors whitespace-nowrap">
              👆 터치하여 전화번호 확인
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
