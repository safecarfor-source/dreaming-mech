'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useErpAuthStore } from '@/lib/erp-auth';

interface Props {
  children: React.ReactNode;
}

const erpTabs = [
  { href: '/erp', label: '대시보드' },
  { href: '/erp/customers', label: '고객관리' },
  { href: '/erp/register', label: '등록' },
  { href: '/erp/sales', label: '매출분석' },
  { href: '/erp/reminders', label: '리마인더' },
];

export default function ErpLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout } = useErpAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Zustand persist hydration 완료 대기
  useEffect(() => {
    const checkHydration = () => {
      if (useErpAuthStore.persist.hasHydrated?.()) {
        setIsHydrated(true);
        return;
      }
      const unsub = useErpAuthStore.persist.onFinishHydration?.(() => {
        setIsHydrated(true);
      });
      return unsub;
    };
    const cleanup = checkHydration();
    return cleanup;
  }, []);

  // 인증 체크: hydration 완료 후 미인증이면 로그인 페이지로
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/erp/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/erp/login');
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-[#111111] h-14 flex items-center justify-between px-4 sm:px-6">
        <h1 className="text-white font-bold text-base tracking-tight">
          <span className="text-[#7C4DFF]">정비소</span> 전산
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          aria-label="로그아웃"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </header>

      {/* 서브 내비게이션 탭 */}
      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex sm:justify-center min-w-max sm:min-w-0 px-4 sm:px-6">
          {erpTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#7C4DFF] text-[#7C4DFF] font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 페이지 컨텐츠 */}
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
