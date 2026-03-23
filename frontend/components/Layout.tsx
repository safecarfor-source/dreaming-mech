'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomTabBar from './consumer/BottomTabBar';
import { useUserStore } from '@/lib/auth';
import { userAuthApi } from '@/lib/api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForMechanics = pathname === '/for-mechanics';
  const isPro = pathname?.startsWith('/pro');
  const isConsumer = !isPro;
  const { isAuthenticated, user, logout } = useUserStore();

  // 삭제된 계정 감지: 서버에 프로필 확인 → 401이면 자동 로그아웃
  useEffect(() => {
    if (!isAuthenticated) return;
    userAuthApi.getProfile().catch((err: any) => {
      if (err?.response?.status === 401) {
        logout();
      }
    });
  }, []); // 마운트 시 1회만

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 상단 헤더 — 56px 고정, 심플 화이트 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB]" style={{ height: '56px' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
          {/* 로고 + 사이트 탭 */}
          <div className="flex items-center gap-0">
            {/* 꿈꾸는정비사 탭 */}
            <Link
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 relative group"
            >
              <span className="text-base md:text-lg font-extrabold tracking-tight text-[#111827]">
                꿈꾸는<span className="text-[#E4015C]">정비사</span>
              </span>
              {/* 소비자 탭 활성 밑줄 */}
              {isConsumer && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#E4015C] rounded-full" />
              )}
            </Link>

            {/* 구분선 */}
            <div className="w-px h-4 bg-[#E5E7EB] mx-1" />

            {/* PRO 탭 */}
            <Link
              href="/pro"
              className="flex flex-col items-start px-3 py-1.5 relative group"
            >
              <span
                className="text-base md:text-lg font-black tracking-widest leading-none"
                style={{ color: '#D4AF37' }}
              >
                PRO
              </span>
              <span className="text-[10px] leading-none font-medium text-[#9CA3AF] mt-0.5">
                정비사 전용
              </span>
              {/* PRO 탭 활성 밑줄 */}
              {isPro && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ backgroundColor: '#D4AF37' }} />
              )}
            </Link>

            {/* 정비사 전용 뱃지 — for-mechanics 페이지에서만 노출 */}
            {isForMechanics && (
              <>
                <div className="w-px h-4 bg-[#E5E7EB] mx-1" />
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4015C] text-white"
                >
                  정비사 전용
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/70" />
                </Link>
              </>
            )}
          </div>

          {/* 모바일 정비 Q&A 링크 */}
          <div className="flex md:hidden items-center">
            <Link
              href="/community"
              className="text-sm font-semibold"
              style={{ color: '#E4015C' }}
            >
              정비 Q&A
            </Link>
          </div>

          {/* 데스크톱 네비게이션 — 모바일 햄버거 없음 (하단 탭바가 대체) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/community"
              className="px-4 py-2 text-sm text-[#111827] hover:text-[#E4015C] hover:bg-[#FFF0F5] transition-colors duration-150 rounded-lg font-medium"
            >
              정비 Q&A
            </Link>
            {/* 로그인 / 내 정보 버튼 */}
            {isAuthenticated && user ? (
              <Link
                href="/mypage"
                className="ml-1 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#E4015C] bg-[#FFF0F5] hover:bg-[#FFE0EC] transition-colors duration-150 rounded-lg"
              >
                <span className="text-base leading-none">👤</span>
                내 정보
              </Link>
            ) : (
              <Link
                href="/login"
                className="ml-1 px-4 py-2 text-sm font-semibold text-white bg-[#E4015C] hover:bg-[#C70150] transition-colors duration-150 rounded-lg"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Q&A 배너 제거됨 — PRO 헤더에 통합 */}

      {/* 헤더 높이만큼 상단 여백 + 모바일 탭바 높이만큼 하단 여백 */}
      <main className="flex-1 pt-[56px] md:pt-[56px] pb-[72px] md:pb-0">
        {/* Q&A 배너 제거됨 */}
        {children}
      </main>

      {/* 푸터 — 라이트 배경, 1열 심플 */}
      <footer className="bg-[#F9FAFB] border-t border-[#E5E7EB] pb-[72px] md:pb-0">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* 브랜드 + 설명 */}
            <div>
              <p className="text-base font-bold text-[#111827] mb-2">
                꿈꾸는<span className="text-[#E4015C]">정비사</span>
              </p>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                유튜브 구독자 5.3만 꿈꾸는 정비사가 직접 검증한<br className="hidden sm:block" />
                전국 자동차 정비소를 한 곳에서 만나보세요.
              </p>
            </div>

            {/* 링크 + 소셜 */}
            <div className="flex gap-8 sm:gap-12">
              <div className="space-y-2">
                <Link href="/terms" className="block text-xs text-[#6B7280] hover:text-[#E4015C] transition-colors">
                  이용약관
                </Link>
                <Link href="/privacy" className="block text-xs text-[#6B7280] hover:text-[#E4015C] transition-colors">
                  개인정보처리방침
                </Link>
              </div>
              <div>
                <a
                  href="https://www.youtube.com/@%EA%BF%88%EA%BE%B8%EB%8A%94%EC%A0%95%EB%B9%84%EC%82%AC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#E4015C] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.5a3 3 0 00-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4a3 3 0 00-2.1 2.1C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 002.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 002.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.5 15.5v-7l6.3 3.5-6.3 3.5z"/>
                  </svg>
                  유튜브 채널
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#9CA3AF] text-center">
              &copy; 2025 꿈꾸는정비사. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 모바일 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}
