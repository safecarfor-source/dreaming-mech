'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from '@/lib/api';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith('/admin')) {
      return;
    }

    // Track page view
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
