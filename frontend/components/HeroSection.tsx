'use client';

import { motion } from 'framer-motion';

interface Props {
  totalMechanics: number;
  totalClicks: number;
}

export default function HeroSection({ totalMechanics, totalClicks }: Props) {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background GIF */}
      <div className="absolute inset-0 z-0">
        <img
          src="/title.gif"
          alt="Background animation"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="container mx-auto px-6 text-center relative z-10">
        {/* 서브 타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#bf00ff] text-lg font-medium tracking-widest mb-6"
        >
          전국의 정비소를 소개합니다.
        </motion.p>

        {/* 메인 헤드라인 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8"
        >
          차를 리프팅합니다
          <br />
          <span className="text-[#bf00ff]">신뢰를 리프팅 합니다</span>
        </motion.h1>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-[#888888] max-w-2xl mx-auto mb-2"
        >
          정비사는 정비를 판매하지 않습니다
        </motion.p>

        {/* 설명2 (바로 밑에 위치) */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-xl text-[#888888] max-w-2xl mx-auto"
        >
          대신 차량을 관리해 드립니다
        </motion.p>

        {/* 스크롤 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-30 flex justify-center"
        >
          <div className="w-10 h-20 border-4 border-white/50 rounded-full flex justify-center pt-3">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-[#bf00ff] rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
