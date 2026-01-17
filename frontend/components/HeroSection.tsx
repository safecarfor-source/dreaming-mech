'use client';

import { motion } from 'framer-motion';

interface Props {
  totalMechanics: number;
  totalClicks: number;
}

export default function HeroSection({ totalMechanics, totalClicks }: Props) {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-violet-900/10" />

      <div className="container mx-auto px-6 text-center relative z-10">
        {/* 서브 타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#8B5CF6] text-lg font-medium tracking-widest mb-6"
        >
          검증된 정비사만 소개합니다
        </motion.p>

        {/* 메인 헤드라인 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8"
        >
          당신의 차를 위한
          <br />
          <span className="text-[#8B5CF6]">진짜 전문가</span>
        </motion.h1>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-[#888888] max-w-2xl mx-auto mb-16"
        >
          실력과 신뢰를 갖춘 정비사들을 한 곳에서 만나보세요
        </motion.p>

        {/* 수치 강조 - 이상한마케팅 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-20"
        >
          <div className="text-center">
            <div className="text-6xl md:text-8xl font-black text-white">
              {totalMechanics}
              <span className="text-[#8B5CF6]">+</span>
            </div>
            <div className="text-[#888888] mt-2 text-lg">검증된 정비사</div>
          </div>

          <div className="hidden md:block w-px h-20 bg-white/10" />

          <div className="text-center">
            <div className="text-6xl md:text-8xl font-black text-white">
              {totalClicks.toLocaleString()}
              <span className="text-[#8B5CF6]">+</span>
            </div>
            <div className="text-[#888888] mt-2 text-lg">누적 조회수</div>
          </div>

          <div className="hidden md:block w-px h-20 bg-white/10" />

          <div className="text-center">
            <div className="text-6xl md:text-8xl font-black text-white">
              98.5
              <span className="text-[#8B5CF6]">%</span>
            </div>
            <div className="text-[#888888] mt-2 text-lg">고객 만족도</div>
          </div>
        </motion.div>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-10 py-4 text-lg font-bold rounded-full transition-all hover:scale-105">
            정비사 찾아보기 →
          </button>
        </motion.div>
      </div>

      {/* 스크롤 인디케이터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
