'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi, trackingLinkApi } from '@/lib/api';
import { captureTrackingCode } from '@/lib/tracking';

// Google Analytics gtag 타입 선언
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const refCaptured = useRef(false);

  // 최초 1회만 ref 파라미터 감지 및 클릭 기록
  useEffect(() => {
    if (refCaptured.current) return;
    refCaptured.current = true;

    const code = captureTrackingCode();
    if (!code) return;

    const recordClick = async () => {
      try {
        await trackingLinkApi.recordClick(code);
      } catch (error) {
        console.debug('TrackingLink click recording failed:', error);
      }
    };

    recordClick();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Skip admin/owner pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/owner')) {
      return;
    }

    // Google Analytics 페이지뷰 (SPA 라우팅 대응)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname });
    }

    // 자체 PageView 통계 기록
    const trackView = async () => {
      try {
        await analyticsApi.trackPageView(pathname, document.referrer || undefined);
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('PageView tracking failed:', error);
      }
    };

    trackView();
  }, [pathname]);

  return null;
}
