'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForMechanics = pathname === '/for-mechanics';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // 스크롤 프로그레스 바 + 네비 축소 효과
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
      setIsScrolled(scrollTop > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 모바일 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hims 스타일 스크롤 프로그레스 바 */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-brand-500 z-[60] transition-[width] duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* 네비게이션 — 스크롤 시 축소 (Hims 스타일) */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--border)]
        transition-all duration-[var(--duration-normal)] ${isScrolled ? 'shadow-[var(--shadow-xs)]' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className={`flex items-center justify-between transition-all duration-[var(--duration-normal)]
            ${isScrolled ? 'h-12 md:h-13' : 'h-14 md:h-16'}`}>
            {/* 왼쪽: 로고 + 뱃지 */}
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="flex items-center gap-1">
                <span className="text-[var(--text-h5)] md:text-[var(--text-h4)] font-extrabold tracking-tight text-text-primary">
                  꿈꾸는<span className="text-brand-500">정비사</span>
                </span>
              </Link>

              {/* 구분선 */}
              <div className="hidden md:block w-px h-5 bg-[var(--border)]" />

              {/* 정비사 전용 뱃지 */}
              <Link
                href={isForMechanics ? '/' : '/for-mechanics'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[var(--text-caption)] font-semibold transition-all duration-[var(--duration-normal)] ${
                  isForMechanics
                    ? 'bg-accent-500 text-white'
                    : 'bg-bg-tertiary text-text-tertiary hover:bg-brand-50 hover:text-brand-500'
                }`}
              >
                정비사 전용
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isForMechanics ? 'bg-white/70' : 'bg-brand-500'
                }`} />
              </Link>
            </div>

            {/* 오른쪽: 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/#map" className="px-4 py-2 text-[var(--text-body)] text-text-secondary hover:text-brand-500 transition-colors duration-[var(--duration-fast)] rounded-lg hover:bg-brand-50 font-medium">
                서비스
              </Link>
              <Link href="/for-mechanics" className="px-4 py-2 text-[var(--text-body)] text-text-secondary hover:text-brand-500 transition-colors duration-[var(--duration-fast)] rounded-lg hover:bg-brand-50 font-medium">
                정비사 사장님
              </Link>
              <Link href="/inquiry" className="px-4 py-2 text-[var(--text-body)] text-text-secondary hover:text-brand-500 transition-colors duration-[var(--duration-fast)] rounded-lg hover:bg-brand-50 font-medium">
                문의하기
              </Link>

              {/* 구분선 */}
              <div className="w-px h-5 bg-[var(--border)] mx-2" />

              <Link
                href="/owner/login"
                className="px-4 py-2 text-[var(--text-body)] text-brand-500 hover:bg-brand-50 transition-colors duration-[var(--duration-fast)] rounded-lg font-semibold"
              >
                사장님 로그인
              </Link>
            </nav>

            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-brand-500 transition-colors rounded-lg"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 — 헤더 밖에 위치해야 backdrop-blur 영향 안 받음 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-14 bottom-0 bg-[#1A0A2E] z-40"
          >
            <div className="flex flex-col h-full">
              <nav className="flex-1 px-6 py-6 space-y-1">
                <Link
                  href="/#map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-base text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  서비스
                </Link>
                <Link
                  href="/for-mechanics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-base text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  정비사 사장님
                </Link>
                <Link
                  href="/inquiry"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-base text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  문의하기
                </Link>
              </nav>

              {/* 하단 사장님 로그인 */}
              <div className="px-6 pb-8 pt-4 border-t border-white/10">
                <Link
                  href="/owner/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3.5 bg-[#7C4DFF] text-white rounded-xl font-semibold text-base transition-colors hover:bg-[#5B3FBF]"
                >
                  사장님 로그인
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="bg-[#111827] pt-12 sm:pt-16 pb-8 sm:pb-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-12">
            {/* 브랜드 */}
            <div>
              <p className="text-[var(--text-h5)] font-bold text-white/90 mb-3">
                꿈꾸는<span className="text-brand-400">정비사</span>
              </p>
              <p className="text-[var(--text-caption)] text-white/50 leading-relaxed">
                유튜브 구독자 5.3만 꿈꾸는 정비사가<br />
                직접 검증한 전국 자동차 정비소를<br />
                한 곳에서 만나보세요.
              </p>
            </div>

            {/* 바로가기 */}
            <div>
              <p className="text-[var(--text-body)] font-semibold text-white/70 mb-3">바로가기</p>
              <nav className="space-y-2">
                <Link href="/#map" className="block text-[var(--text-caption)] text-white/40 hover:text-brand-400 transition-colors duration-[var(--duration-fast)]">
                  정비소 찾기
                </Link>
                <Link href="/for-mechanics" className="block text-[var(--text-caption)] text-white/40 hover:text-brand-400 transition-colors duration-[var(--duration-fast)]">
                  정비사 사장님
                </Link>
                <Link href="/inquiry" className="block text-[var(--text-caption)] text-white/40 hover:text-brand-400 transition-colors duration-[var(--duration-fast)]">
                  문의하기
                </Link>
                <Link href="/owner/login" className="block text-[var(--text-caption)] text-white/40 hover:text-brand-400 transition-colors duration-[var(--duration-fast)]">
                  사장님 로그인
                </Link>
              </nav>
            </div>

            {/* 연락처 */}
            <div>
              <p className="text-[var(--text-body)] font-semibold text-white/70 mb-3">소셜</p>
              <a
                href="https://www.youtube.com/@dreaming-mechanic"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--text-caption)] text-white/40 hover:text-brand-400 transition-colors duration-[var(--duration-fast)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5a3 3 0 00-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4a3 3 0 00-2.1 2.1C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 002.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 002.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.5 15.5v-7l6.3 3.5-6.3 3.5z"/></svg>
                유튜브 채널
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 sm:pt-8">
            <p className="text-[var(--text-caption)] text-white/30 text-center">
              &copy; 2025 꿈꾸는정비사. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
