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
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group transition-all hover:border-[#bf00ff] hover:shadow-xl hover:shadow-[#bf00ff]/10"
    >
      {/* 이미지 - 정사각형 (1:1) */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={sanitizeText(mechanic.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs md:text-base">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3 md:p-6">
        <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2 md:mb-4 group-hover:text-purple-600 transition-colors break-words line-clamp-1">
          {sanitizeText(mechanic.name)}
        </h3>

        <div className="space-y-1 md:space-y-2 text-gray-500 text-xs md:text-sm">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <MapPin size={12} className="text-gray-500 flex-shrink-0 md:hidden" />
            <MapPin size={16} className="text-gray-500 flex-shrink-0 hidden md:block" />
            <span className="break-words line-clamp-1">{sanitizeText(mechanic.location)}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <Phone size={12} className="text-gray-500 flex-shrink-0 md:hidden" />
            <Phone size={16} className="text-gray-500 flex-shrink-0 hidden md:block" />
            <span className="break-all line-clamp-1">{sanitizePhone(mechanic.phone)}</span>
          </div>
        </div>

        {/* 자세히 보기 - 모바일에서 숨김 */}
        <div className="hidden md:block mt-6 pt-4 border-t border-gray-100">
          <span className="text-gray-500 text-sm font-medium group-hover:underline">
            자세히 보기 →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
