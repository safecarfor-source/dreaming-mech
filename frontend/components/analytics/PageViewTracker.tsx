'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from '@/lib/api';
import { captureRefCode } from '@/lib/referral';

// Google Analytics gtag 타입 선언
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin/owner pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/owner')) {
      return;
    }

    // ?ref= 파라미터 캡처 및 localStorage 저장
    const refCode = captureRefCode();

    // Google Analytics 페이지뷰 (SPA 라우팅 대응)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname });
    }

    // 자체 PageView 통계 기록
    const trackView = async () => {
      try {
        await analyticsApi.trackPageView(
          pathname,
          document.referrer || undefined,
          refCode || undefined,
        );
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('PageView tracking failed:', error);
      }
    };

    trackView();
  }, [pathname]);

  return null;
}
