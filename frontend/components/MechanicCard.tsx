'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { Mechanic } from '@/types';
import { sanitizeText, sanitizePhone } from '@/lib/sanitize';
import { gtagEvent } from '@/lib/gtag-events';
import PhoneReveal from './mechanic-detail/PhoneReveal';

interface Props {
  mechanic: Mechanic;
  onClick: () => void;
  isPremium?: boolean;
}

export default function MechanicCard({ mechanic, onClick, isPremium }: Props) {
  const handleClick = () => {
    gtagEvent.mechanicCardClick(mechanic.id, mechanic.name, mechanic.location || '');
    onClick();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
        isPremium
          ? 'shadow-[0_2px_12px_rgba(124,92,252,0.15)] hover:shadow-md'
          : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-[#7C4DFF]/30'
      }`}
      style={isPremium ? { border: '1.5px solid rgba(124, 92, 252, 0.2)' } : undefined}
    >
      {/* 이미지 — 프리미엄은 16:9, 일반은 1:1 */}
      <div className={`${isPremium ? 'aspect-video' : 'aspect-square'} bg-gray-100 relative overflow-hidden`}>
        {(mechanic.mainImageUrl || mechanic.galleryImages?.[0]) ? (
          <Image
            src={mechanic.mainImageUrl || mechanic.galleryImages![0]}
            alt={sanitizeText(mechanic.name)}
            width={200}
            height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes={isPremium ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-300">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 7h.01M9 11h.01M9 15h.01M13 7h.01M13 11h.01M13 15h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          flex items-end p-2">
          <span className="text-white font-bold text-[10px] sm:text-xs">
            바로 확인 &rarr;
          </span>
        </div>
        {/* 유튜브 영상 뱃지 — 모바일 숨김 */}
        {(mechanic.youtubeUrl || mechanic.youtubeLongUrl) && (
          <div className="hidden md:flex absolute top-3 left-3 z-10">
            <span
              className="flex items-center gap-1.5 rounded-lg text-white font-semibold text-[11.5px]"
              style={{
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '5px 10px 5px 8px',
              }}
            >
              {/* 빨간 원 + 재생 아이콘 */}
              <span className="flex items-center justify-center flex-shrink-0 rounded-full bg-[#FF0000]"
                style={{ width: 18, height: 18 }}>
                <svg width="8" height="10" viewBox="0 0 8 10" fill="white">
                  <path d="M0 0L8 5L0 10V0Z" />
                </svg>
              </span>
              영상보기
            </span>
          </div>
        )}
        {/* 프리미엄 뱃지 — 모바일 only */}
        {isPremium && (
          <div className="absolute top-2 left-2 z-10 md:hidden">
            <span
              className="text-white text-[9px] font-bold rounded px-1.5 py-0.5"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #a855f7)' }}
            >
              PREMIUM
            </span>
          </div>
        )}
      </div>

      {/* 정보 — 컴팩트 */}
      <div className="p-2 sm:p-2.5">
        <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 mb-1
          group-hover:text-[#7C4DFF] transition-colors line-clamp-1">
          {sanitizeText(mechanic.name)}
        </h3>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={10} className="text-gray-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">
              {sanitizeText(mechanic.location)}
            </span>
          </div>
          <PhoneReveal
            mechanicId={mechanic.id}
            mechanicName={sanitizeText(mechanic.name)}
            phone={sanitizePhone(mechanic.phone)}
            variant="card"
            youtubeUrl={mechanic.youtubeUrl}
            youtubeLongUrl={mechanic.youtubeLongUrl}
            onYoutubeClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
