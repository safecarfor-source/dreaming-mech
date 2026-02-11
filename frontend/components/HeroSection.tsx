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
    400 + 2400 // Start after headline completes (400ms initial + ~2000ms typing)
  );
  const description2 = useTypingEffect(
    '대신 차량을 관리해 드립니다',
    60,
    400 + 2400 + 1200 // Start after description1 completes
  );

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 md:pt-24">
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

        {/* 메인 헤드라인 with typing effect */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8 min-h-[200px] md:min-h-[280px] lg:min-h-[320px] break-keep"
        >
          {headline.displayedText.split('\n').map((line, index) => (
            <span key={index}>
              {index === 0 ? line : <span className="text-[#bf00ff]">{line}</span>}
              {index === 0 && <br />}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </motion.h1>

        {/* 설명 with typing effect */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="text-xl text-gray-500 max-w-2xl mx-auto mb-2 min-h-[32px] break-keep"
        >
          {description1.displayedText}
          {!description1.isComplete && <span className="animate-pulse">|</span>}
        </motion.p>

        {/* 설명2 (바로 밑에 위치) with typing effect */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="text-xl text-gray-500 max-w-2xl mx-auto min-h-[32px] break-keep"
        >
          {description2.displayedText}
          {!description2.isComplete && <span className="animate-pulse">|</span>}
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
              className="w-2 h-2 bg-gray-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
