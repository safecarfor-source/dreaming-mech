'use client';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({
  end,
  duration = 2000,
  delay = 0,
  suffix = '',
  decimals = 0,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const prevEndRef = useRef<number | null>(null);
  const countRef = useRef(0); // 현재 count를 ref로 추적

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    if (!isInView) return;

    // 첫 애니메이션이거나 end 값이 변경된 경우에만 실행
    if (prevEndRef.current === end) return;
    prevEndRef.current = end;

    const startTimeout = setTimeout(() => {
      let startTime: number | null = null;
      const startValue = countRef.current; // ref에서 현재 값 읽기
      const endValue = end;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        // Easing: easeOutCubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentCount = startValue + (endValue - startValue) * easedProgress;

        setCount(currentCount);
        countRef.current = currentCount;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(endValue);
          countRef.current = endValue;
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isInView, end, duration, delay]);

  const displayValue = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  );
}
