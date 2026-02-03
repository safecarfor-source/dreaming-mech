'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Eye } from 'lucide-react';
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
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer group transition-all hover:border-[#bf00ff] hover:shadow-xl hover:shadow-[#bf00ff]/10"
    >
      {/* 이미지 */}
      <div className="h-52 bg-gray-100 relative overflow-hidden">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={sanitizeText(mechanic.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
        {/* 조회수 뱃지 */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <Eye size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{mechanic.clickCount}</span>
        </div>
      </div>

      {/* 정보 */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors break-words">
          {sanitizeText(mechanic.name)}
        </h3>

        <div className="space-y-2 text-gray-500 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={16} className="text-gray-500 flex-shrink-0" />
            <span className="break-words">{sanitizeText(mechanic.location)}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Phone size={16} className="text-gray-500 flex-shrink-0" />
            <span className="break-all">{sanitizePhone(mechanic.phone)}</span>
          </div>
        </div>

        {/* 자세히 보기 */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <span className="text-gray-500 text-sm font-medium group-hover:underline">
            자세히 보기 →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
