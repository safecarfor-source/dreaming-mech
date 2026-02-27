'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Phone } from 'lucide-react';
import type { Mechanic } from '@/types';
import { sanitizeText, sanitizePhone } from '@/lib/sanitize';
import { gtagEvent } from '@/lib/gtag-events';

interface Props {
  mechanic: Mechanic;
  onClick: () => void;
}

export default function MechanicCard({ mechanic, onClick }: Props) {
  const handleClick = () => {
    gtagEvent.mechanicCardClick(mechanic.id, mechanic.name, mechanic.location || '');
    onClick();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer group
        shadow-sm hover:shadow-md hover:border-[#7C4DFF]/30
        transition-all duration-300"
    >
      {/* 이미지 — 1:1 비율 (컴팩트) */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {(mechanic.mainImageUrl || mechanic.galleryImages?.[0]) ? (
          <Image
            src={mechanic.mainImageUrl || mechanic.galleryImages![0]}
            alt={sanitizeText(mechanic.name)}
            width={200}
            height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
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
          <div className="flex items-center gap-1 min-w-0">
            <Phone size={10} className="text-gray-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">
              {sanitizePhone(mechanic.phone)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
