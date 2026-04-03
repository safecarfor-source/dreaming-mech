'use client';

import { motion } from 'framer-motion';
import { Smartphone, Clock } from 'lucide-react';

export default function ShortformTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mx-auto">
          <Smartphone className="w-7 h-7 text-gray-500" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20 mb-3">
            <Clock className="w-3 h-3" />
            Phase 2 — 준비 중
          </div>
          <h3 className="text-white font-semibold text-base mb-2">
            숏폼 제작 도구
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            유튜브 쇼츠, 인스타그램 릴스용 숏폼 콘텐츠를<br />
            자동으로 기획하고 편집 가이드를 생성합니다.
          </p>
        </div>

        <p className="text-gray-600 text-xs">
          제작 탭의 분석 결과를 기반으로 숏폼을 생성할 예정입니다
        </p>
      </motion.div>
    </div>
  );
}
