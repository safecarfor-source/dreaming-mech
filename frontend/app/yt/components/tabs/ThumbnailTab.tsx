'use client';

import { motion } from 'framer-motion';
import { Image, Clock } from 'lucide-react';

export default function ThumbnailTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mx-auto">
          <Image className="w-7 h-7 text-gray-500" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20 mb-3">
            <Clock className="w-3 h-3" />
            Phase 2 — 준비 중
          </div>
          <h3 className="text-white font-semibold text-base mb-2">
            썸네일 전문가
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            트렌드 썸네일 분석, 문구 전략 생성,<br />
            레퍼런스 이미지 비교 도구를 제공합니다.
          </p>
        </div>

        <p className="text-gray-600 text-xs">
          프로젝트카드에도 동일한 구조의 썸네일 탭이 추가될 예정입니다
        </p>
      </motion.div>
    </div>
  );
}
