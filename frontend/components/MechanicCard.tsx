'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Phone } from 'lucide-react';
import type { Mechanic } from '@/types';
import { sanitizeText, sanitizePhone } from '@/lib/sanitize';

interface Props {
  mechanic: Mechanic;
  onClick: () => void;
}

export default function MechanicCard({ mechanic, onClick }: Props) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden cursor-pointer group
        shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-lg)] hover:border-brand-400/40
        transition-[box-shadow,border-color] duration-[var(--duration-slow)]"
    >
      {/* 이미지 — 4:3 비율 통일 + Hims 스타일 호버 오버레이 */}
      <div className="aspect-[4/3] bg-bg-tertiary relative overflow-hidden">
        {mechanic.mainImageUrl ? (
          <Image
            src={mechanic.mainImageUrl}
            alt={sanitizeText(mechanic.name)}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-300">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 7h.01M9 11h.01M9 15h.01M13 7h.01M13 11h.01M13 15h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {/* Hims 스타일 호버 오버레이 CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-[var(--duration-slow)]
          flex items-end p-3 sm:p-4">
          <span className="text-white font-bold text-[var(--text-caption)] sm:text-[var(--text-body)]">
            바로 확인 &rarr;
          </span>
        </div>
      </div>

      {/* 정보 — 8px 그리드 기반 패딩 */}
      <div className="p-3 sm:p-4 md:p-5">
        <h3 className="text-[var(--text-body)] md:text-[var(--text-h5)] font-bold text-text-primary mb-2 sm:mb-3
          group-hover:text-brand-500 transition-colors duration-[var(--duration-normal)] line-clamp-1">
          {sanitizeText(mechanic.name)}
        </h3>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <MapPin size={14} className="text-text-muted flex-shrink-0" />
            <span className="text-[var(--text-caption)] md:text-[var(--text-body)] text-text-secondary line-clamp-1">
              {sanitizeText(mechanic.location)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Phone size={14} className="text-text-muted flex-shrink-0" />
            <span className="text-[var(--text-caption)] md:text-[var(--text-body)] text-text-secondary line-clamp-1">
              {sanitizePhone(mechanic.phone)}
            </span>
          </div>
        </div>

        {/* 견적 받기 — 데스크탑 */}
        <div className="hidden md:block mt-4 pt-3 border-t border-border-light">
          <span className="text-[var(--text-caption)] font-semibold text-text-tertiary group-hover:text-brand-500 transition-colors duration-[var(--duration-fast)]">
            견적 받기 &rarr;
          </span>
        </div>
      </div>
    </motion.div>
  );
}
