'use client';

import { motion } from 'framer-motion';

interface Props {
  totalMechanics: number;
  totalClicks: number;
}

export default function HeroSection({ totalMechanics, totalClicks }: Props) {
  return (
    <section className="bg-gradient-to-br from-black to-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-6"
        >
          믿을 수 있는 정비사를
          <br />
          <span className="text-yellow-400">찾으세요</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 mb-12"
        >
          클릭 한 번으로 확인하는 검증된 정비소
        </motion.p>

        <div className="flex justify-center gap-12">
          <div>
            <div className="text-5xl font-bold text-yellow-400">
              {totalMechanics}
            </div>
            <div className="text-gray-400 mt-2">등록된 정비사</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-yellow-400">
              {totalClicks}
            </div>
            <div className="text-gray-400 mt-2">총 조회수</div>
          </div>
        </div>
      </div>
    </section>
  );
}
