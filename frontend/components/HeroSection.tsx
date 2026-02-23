'use client';

import { motion } from 'framer-motion';

interface Props {
  totalMechanics: number;
  totalClicks: number;
}

export default function HeroSection({ totalMechanics, totalClicks }: Props) {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-16">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          src="/title.gif"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="container mx-auto px-6 text-left relative z-10 max-w-5xl">
        {/* 서브 타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-white/70 text-sm md:text-lg lg:text-xl font-medium tracking-widest mb-4 md:mb-6 uppercase"
        >
          전국의 정비소를 소개합니다
        </motion.p>

        {/* 메인 헤드라인 */}
        <div className="mb-6 md:mb-8 break-keep" style={{ fontSize: 'clamp(2rem, 5.5vw, 5.5rem)' }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="font-black leading-[1.15] text-white"
          >
            차를 리프팅합니다
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="font-black leading-[1.15] text-[#B388FF]"
          >
            신뢰를 리프팅합니다
          </motion.h1>
        </div>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
          className="text-base md:text-xl lg:text-2xl text-white/60 max-w-3xl mb-1 md:mb-2 break-keep"
        >
          정비사는 정비를 판매하지 않습니다
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
          className="text-base md:text-xl lg:text-2xl text-white/60 max-w-3xl break-keep"
        >
          대신 차량을 관리해 드립니다
        </motion.p>

        {/* 스크롤 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-30 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M6 9l6 6 6-6" />
            </svg>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 -mt-3">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
