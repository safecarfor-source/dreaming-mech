'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Eye } from 'lucide-react';
import type { Mechanic } from '@/types';

interface Props {
  mechanic: Mechanic;
  onClick: () => void;
}

export default function MechanicCard({ mechanic, onClick }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
    >
      {/* 이미지 */}
      <div className="h-48 bg-gray-200">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={mechanic.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{mechanic.name}</h3>

        <div className="space-y-2 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{mechanic.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>{mechanic.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span className="font-semibold text-blue-600">
              조회수 {mechanic.clickCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
