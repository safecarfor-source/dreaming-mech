'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/auth';
import { LayoutDashboard, Store, MessageSquare, LogOut, Menu, X } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

// 로그인이 필요한 경로 목록
const PROTECTED_PATHS = ['/pro/dashboard'];

export default function ProLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useUserStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 보호 경로 접근 시 미로그인이면 /pro/login으로
  const isProtected = PROTECTED_PATHS.some((p) => pathname?.startsWith(p));
  useEffect(() => {
    if (isHydrated && isProtected && !isAuthenticated) {
      router.push('/pro/login');
    }
  }, [isHydrated, isProtected, isAuthenticated, router]);

  // 이미 로그인 상태에서 /pro/login 방문 시 대시보드로
  useEffect(() => {
    if (isHydrated && isAuthenticated && pathname === '/pro/login') {
      router.replace('/pro/dashboard');
    }
  }, [isHydrated, isAuthenticated, pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // 무시
    } finally {
      logout();
      router.push('/pro');
    }
  };

  const isPublicPage = !isProtected;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-[#D4AF37]/15">
        <div className="max-w-[520px] mx-auto px-5 h-14 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/pro" className="flex items-center gap-1.5">
            <span className="text-white font-bold text-base tracking-tight">꿈꾸는정비사</span>
            <span
              className="font-black text-sm tracking-widest"
              style={{ color: '#D4AF37' }}
            >
              PRO
            </span>
          </Link>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3">
            {isHydrated && isAuthenticated ? (
              /* 로그인 상태: 햄버거 메뉴 */
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="메뉴 열기"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            ) : (
              /* 비로그인: 가입 버튼 */
              <Link
                href="/pro/login"
                className="text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors"
                style={{
                  color: '#D4AF37',
                  borderColor: '#D4AF37',
                }}
              >
                가입하기
              </Link>
            )}
          </div>
        </div>

        {/* 드롭다운 메뉴 (로그인 후) */}
        {menuOpen && isAuthenticated && (
          <div className="absolute top-14 right-0 left-0 bg-[#222] border-b border-[#D4AF37]/15">
            <div className="max-w-[520px] mx-auto px-5 py-3 flex flex-col gap-1">
              {[
                { href: '/pro/dashboard', label: '대시보드', icon: LayoutDashboard },
                { href: '/owner/mechanics', label: '내 정비소', icon: Store },
                { href: '/owner', label: '문의함', icon: MessageSquare },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                    pathname === item.href
                      ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 컨텐츠 (네비 높이 오프셋) */}
      <div className={isPublicPage ? 'pt-14' : 'pt-14'}>
        {children}
      </div>
    </div>
  );
}
