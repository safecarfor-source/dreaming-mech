'use client';

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
      {/* 이미지 — 4:3 비율 통일 */}
      <div className="aspect-[4/3] bg-bg-tertiary relative overflow-hidden">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={sanitizeText(mechanic.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-[var(--text-caption)]">
            이미지 없음
          </div>
        )}
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

        {/* 자세히 보기 — 데스크탑 */}
        <div className="hidden md:block mt-4 pt-3 border-t border-border-light">
          <span className="text-[var(--text-caption)] font-medium text-text-tertiary group-hover:text-brand-500 transition-colors">
            자세히 보기 &rarr;
          </span>
        </div>
      </div>
    </motion.div>
  );
}
