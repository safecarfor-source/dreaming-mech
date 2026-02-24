'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCheck,
  MessageSquare,
  FileText,
  Star,
  MessageCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const menuItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/mechanics', label: '정비사 관리', icon: Users },
  { href: '/admin/owners', label: '사장님 관리', icon: UserCheck },
  { href: '/admin/inquiries', label: '문의 관리', icon: MessageSquare, badgeKey: 'inquiries' as const },
  { href: '/admin/service-inquiries', label: '서비스 문의', icon: MessageCircle, badgeKey: 'serviceInquiries' as const },
  { href: '/admin/quote-requests', label: '견적 요청', icon: FileText },
  { href: '/admin/reviews', label: '리뷰 관리', icon: Star },
  { href: '/admin/stats', label: '통계', icon: BarChart3 },
];

export default function AdminLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, admin, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [badges, setBadges] = useState<{ inquiries: number; serviceInquiries: number }>({ inquiries: 0, serviceInquiries: 0 });

  // 문의 건수 가져오기
  const fetchBadges = useCallback(async () => {
    try {
      const [inqRes, svcRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries?page=1&limit=1`, { credentials: 'include' }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-inquiries?page=1&limit=1`, { credentials: 'include' }).catch(() => null),
      ]);
      const inqData = inqRes?.ok ? await inqRes.json() : null;
      const svcData = svcRes?.ok ? await svcRes.json() : null;
      setBadges({
        inquiries: inqData?.total || 0,
        serviceInquiries: svcData?.total || 0,
      });
    } catch {}
  }, []);

  // Zustand persist가 localStorage에서 완전히 복원된 후에만 인증 체크
  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated?.()) {
        setIsHydrated(true);
        return;
      }
      const unsub = useAuthStore.persist.onFinishHydration?.(() => {
        setIsHydrated(true);
      });
      return unsub;
    };
    
    const cleanup = checkHydration();
    return cleanup;
  }, []);

  // 뱃지 카운트 로드 + 30초 간격 폴링
  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [isHydrated, isAuthenticated, fetchBadges]);

  useEffect(() => {
    // Only check authentication after hydration
    if (isHydrated && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear the HttpOnly cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local auth state regardless of API call result
      logout();
      router.push('/admin/login');
    }
  };

  // Show loading while hydrating or if not authenticated
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#111111] z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* 로고 */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">
              <span className="text-purple-600">꿈꾸는</span>정비사
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* 메뉴 */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-purple-600' : 'bg-red-500 text-white'
                    }`}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 하단 로그아웃 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="text-sm text-gray-400 mb-3">{admin?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="lg:ml-64">
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="text-sm text-gray-500">
            관리자: {admin?.name || admin?.email}
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
