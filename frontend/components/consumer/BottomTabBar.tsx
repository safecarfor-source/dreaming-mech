'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Phone, User, X } from 'lucide-react';
import { useUserStore } from '@/lib/auth';

const tabs = [
  { href: '/', label: '홈', icon: Home, authRequired: false },
  { href: '/#shops', label: '정비소 찾기', icon: Search, authRequired: false },
  { href: '/inquiry', label: '문의하기', icon: Phone, authRequired: true },
  { href: '/mypage', label: '내정보', icon: User, authRequired: true },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/#shops') return false;
    return pathname.startsWith(href);
  };

  const handleTabClick = (tab: typeof tabs[0], e: React.MouseEvent) => {
    if (tab.authRequired && !isAuthenticated) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const handleKakaoLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    window.location.href = `${apiUrl}/auth/kakao`;
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#E8E4DC] border-t border-[#D5D0C8] md:hidden"
        style={{ height: '56px' }}
      >
        <div className="flex items-center justify-around h-full max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(tab, e)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  active ? 'text-[#E4015C]' : 'text-[#9CA3AF]'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-normal'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[22px] font-black tracking-tight mb-1">
              <span className="text-[#1F2937]">꿈꾸는</span>
              <span className="text-[#E4015C]">정비사</span>
            </div>
            <p className="text-[16px] text-gray-700 font-medium text-center leading-[1.7]">
              로그인이 필요한 서비스입니다
            </p>
            <button
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] font-bold rounded-xl py-3.5 text-[16px] transition-colors mt-1"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.866 2 8.4c0 2.21 1.388 4.154 3.493 5.275L4.6 17.1a.25.25 0 0 0 .363.281L9.19 14.77c.269.02.539.03.81.03 4.418 0 8-2.866 8-6.4S14.418 2 10 2z" fill="#191919"/>
              </svg>
              카카오로 1초 로그인
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-[14px] text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}
