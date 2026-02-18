'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  totalMechanics: number;
  totalClicks: number;
}

// Custom hook for typing effect
function useTypingEffect(
  text: string,
  speed: number = 50,
  startDelay: number = 0
) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(typingInterval);
        }
      }, speed);

      return () => clearInterval(typingInterval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
}

export default function HeroSection({ totalMechanics, totalClicks }: Props) {
  // Typing effects with sequential delays
  const headline = useTypingEffect('차를 리프팅합니다\n신뢰를 리프팅 합니다', 80, 400);
  const description1 = useTypingEffect(
    '정비를 판매하지 않습니다',
    60,
    400 + 2400
  );
  const description2 = useTypingEffect(
    '차량을 관리해 드립니다',
    60,
    400 + 2400 + 1200
  );

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-16 bg-black">
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

      {/* Netflix 스타일 멀티 레이어 오버레이 */}
      {/* Layer 1: 베이스 틴트 — 전체 균일 어둡게 */}
      <div className="absolute inset-0 z-[1] bg-black/40" />
      {/* Layer 2: 하단 집중 그라데이션 — 텍스트 영역 강화 */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      {/* Layer 3: 비네팅 효과 — 가장자리 자연스러운 어둡게 */}
      <div
        className="absolute inset-0 z-[3]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center relative z-10">
        {/* 서브 타이틀 — 밝은 화이트 + 약간 작게 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/80 text-[var(--text-caption)] sm:text-[var(--text-body)] md:text-[var(--text-h5)]
            font-medium tracking-[0.1em] uppercase mb-5 sm:mb-6 md:mb-8"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          전국의 정비소를 소개합니다
        </motion.p>

        {/* 메인 헤드라인 — 넷플릭스 원칙: 순백 #FFF, font-black, text-shadow */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white font-black leading-[1.1] mb-8 sm:mb-10 md:mb-12
            min-h-[100px] sm:min-h-[160px] md:min-h-[240px] lg:min-h-[280px]
            break-keep whitespace-nowrap"
          style={{
            fontSize: 'clamp(2rem, 6vw, 5.5rem)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {headline.displayedText.split('\n').map((line, index) => (
            <span key={index}>
              {line}
              {index === 0 && <br />}
            </span>
          ))}
          <span className="animate-pulse text-white/60">|</span>
        </motion.h1>

        {/* 설명 — white/80으로 가독성 확보, text-shadow 추가 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="text-[var(--text-body)] sm:text-[var(--text-h5)] md:text-[var(--text-h4)]
            text-white/80 max-w-2xl mx-auto mb-1.5 sm:mb-2
            min-h-[24px] sm:min-h-[32px] md:min-h-[36px] break-keep font-medium"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
        >
          {description1.displayedText}
          {!description1.isComplete && <span className="animate-pulse text-white/50">|</span>}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="text-[var(--text-body)] sm:text-[var(--text-h5)] md:text-[var(--text-h4)]
            text-white/80 max-w-2xl mx-auto
            min-h-[24px] sm:min-h-[32px] md:min-h-[36px] break-keep font-medium"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
        >
          {description2.displayedText}
          {!description2.isComplete && <span className="animate-pulse text-white/50">|</span>}
        </motion.p>

        {/* CTA 버튼 — 브랜드 색상은 여기에만 (넷플릭스 원칙) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.5, duration: 0.6 }}
          className="mt-10 sm:mt-12 md:mt-14"
        >
          <motion.a
            href="#map"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 bg-brand-500 hover:bg-brand-600 text-white
              rounded-full font-bold px-8 sm:px-10 py-4 sm:py-5
              text-[var(--text-body)] sm:text-[var(--text-h5)]
              shadow-[0_4px_24px_rgba(124,77,255,0.4)] hover:shadow-[0_6px_32px_rgba(124,77,255,0.5)]
              transition-all duration-[var(--duration-normal)]"
          >
            내 주변 정비소 찾기
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </motion.a>
        </motion.div>

        {/* 스크롤 인디케이터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 sm:mt-20 md:mt-24 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-0.5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M6 9l6 6 6-6" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-25 -mt-3">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
