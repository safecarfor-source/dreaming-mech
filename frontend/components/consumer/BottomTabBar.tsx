'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Phone } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  // /search 페이지 미구현 — 메인 정비소 목록 섹션 앵커로 연결
  { href: '/#shops', label: '정비소 찾기', icon: Search },
  { href: '/inquiry', label: '문의하기', icon: Phone },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/#shops') return false; // 앵커는 active 상태 없음
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] md:hidden"
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
  );
}
