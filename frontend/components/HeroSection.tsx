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
  const headline1 = useTypingEffect('차를 리프팅합니다', 80, 400);
  const headline2 = useTypingEffect('신뢰를 리프팅합니다', 80, 400 + 1600);
  const description1 = useTypingEffect(
    '정비사는 정비를 판매하지 않습니다',
    60,
    400 + 1600 + 1800 // Start after headlines complete
  );
  const description2 = useTypingEffect(
    '대신 차량을 관리해 드립니다',
    60,
    400 + 1600 + 1800 + 1200 // Start after description1 completes
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

      {/* Dark overlay for text readability - stronger like 이상한마케팅 */}
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="container mx-auto px-6 text-left relative z-10 max-w-5xl">
        {/* 서브 타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/70 text-sm md:text-lg lg:text-xl font-medium tracking-widest mb-4 md:mb-6 uppercase"
        >
          전국의 정비소를 소개합니다
        </motion.p>

        {/* 메인 헤드라인 - 이상한마케팅 스타일: 흰색 + 브랜드색 강조 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-black leading-[1.15] mb-6 md:mb-8 min-h-[100px] sm:min-h-[160px] md:min-h-[220px] lg:min-h-[260px] break-keep"
          style={{ fontSize: 'clamp(2rem, 5.5vw, 5.5rem)' }}
        >
          <span className="text-white">
            {headline1.displayedText}
            {!headline1.isComplete && <span className="animate-pulse">|</span>}
          </span>
          <br />
          <span className="text-[#B388FF]">
            {headline2.displayedText}
            {headline1.isComplete && !headline2.isComplete && <span className="animate-pulse">|</span>}
          </span>
        </motion.h1>

        {/* 설명 - 흰색 반투명 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="text-base md:text-xl lg:text-2xl text-white/60 max-w-3xl mb-1 md:mb-2 min-h-[28px] md:min-h-[36px] break-keep"
        >
          {description1.displayedText}
          {!description1.isComplete && headline2.isComplete && <span className="animate-pulse text-white">|</span>}
        </motion.p>

        {/* 설명2 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="text-base md:text-xl lg:text-2xl text-white/60 max-w-3xl min-h-[28px] md:min-h-[36px] break-keep"
        >
          {description2.displayedText}
          {!description2.isComplete && description1.isComplete && <span className="animate-pulse text-white">|</span>}
        </motion.p>

        {/* 스크롤 인디케이터 - 아래 화살표 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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
