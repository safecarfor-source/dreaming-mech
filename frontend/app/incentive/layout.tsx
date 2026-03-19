'use client';

import { usePathname } from 'next/navigation';
import IncentiveLayout from '@/components/incentive/IncentiveLayout';

interface IncentiveRootLayoutProps {
  children: React.ReactNode;
}

export default function IncentiveRootLayout({ children }: IncentiveRootLayoutProps) {
  const pathname = usePathname();

  // 로그인 페이지는 레이아웃(탑바/탭) 없이 렌더링
  if (pathname === '/incentive/login') {
    return <>{children}</>;
  }

  return <IncentiveLayout>{children}</IncentiveLayout>;
}
