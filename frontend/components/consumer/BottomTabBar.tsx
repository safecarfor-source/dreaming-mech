'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Phone, User } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/#shops', label: '정비소 찾기', icon: Search },
  { href: '/inquiry', label: '문의하기', icon: Phone },
  { href: '/mypage', label: '내정보', icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/#shops') return false;
    return pathname.startsWith(href);
  };

  return (
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
