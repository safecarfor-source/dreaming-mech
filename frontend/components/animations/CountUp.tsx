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
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    setHasAnimated(true);

    const startTimeout = setTimeout(() => {
      let startTime: number | null = null;
      const startValue = 0;
      const endValue = end;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        // Easing: easeOutCubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentCount = startValue + (endValue - startValue) * easedProgress;

        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isInView, end, duration, delay, hasAnimated]);

  const displayValue = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  );
}
