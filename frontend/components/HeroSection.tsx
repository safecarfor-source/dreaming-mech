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
    '정비사는 정비를 판매하지 않습니다',
    60,
    400 + 2400
  );
  const description2 = useTypingEffect(
    '대신 차량을 관리해 드립니다',
    60,
    400 + 2400 + 1200
  );

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

      {/* Dark overlay — 65%로 약간 더 어둡게 (텍스트 대비율 확보) */}
      <div className="absolute inset-0 bg-black/65 z-0" />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center relative z-10">
        {/* 서브 타이틀 — 10% 강조색 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[var(--accent-400)] text-[var(--text-body)] sm:text-[var(--text-h5)] md:text-[var(--text-h4)]
            font-medium tracking-[0.08em] mb-4 sm:mb-5 md:mb-6"
        >
          전국의 정비소를 소개합니다.
        </motion.p>

        {/* 메인 헤드라인 — 모듈러 스케일 적용 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-black leading-[1.1] mb-6 sm:mb-8 md:mb-10
            min-h-[100px] sm:min-h-[160px] md:min-h-[240px] lg:min-h-[280px]
            break-keep whitespace-nowrap"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 5rem)' }}
        >
          {headline.displayedText.split('\n').map((line, index) => (
            <span key={index}>
              {index === 0 ? line : <span className="text-brand-400">{line}</span>}
              {index === 0 && <br />}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </motion.h1>

        {/* 설명 — 절제된 크기, 더 나은 여백 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="text-[var(--text-body)] sm:text-[var(--text-h5)] md:text-[var(--text-h4)]
            text-white/60 max-w-2xl mx-auto mb-1.5 sm:mb-2
            min-h-[24px] sm:min-h-[32px] md:min-h-[36px] break-keep"
        >
          {description1.displayedText}
          {!description1.isComplete && <span className="animate-pulse">|</span>}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="text-[var(--text-body)] sm:text-[var(--text-h5)] md:text-[var(--text-h4)]
            text-white/60 max-w-2xl mx-auto
            min-h-[24px] sm:min-h-[32px] md:min-h-[36px] break-keep"
        >
          {description2.displayedText}
          {!description2.isComplete && <span className="animate-pulse">|</span>}
        </motion.p>

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
