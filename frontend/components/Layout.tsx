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
    <div className="min-h-screen flex flex-col bg-[#F8F7FC]">
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* 왼쪽: 로고 + 뱃지 */}
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="flex items-center gap-1">
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900">
                  꿈꾸는<span className="text-[#7C4DFF]">정비사</span>
                </span>
              </Link>

              {/* 구분선 */}
              <div className="hidden md:block w-px h-5 bg-gray-200" />

              {/* 정비사 전용 뱃지 - 토글 */}
              <Link
                href={isForMechanics ? '/' : '/for-mechanics'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  isForMechanics
                    ? 'bg-[#F59E0B] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-[#7C4DFF]/10 hover:text-[#7C4DFF]'
                }`}
              >
                정비사 전용
                <span className={`inline-block w-2 h-2 rounded-full ${
                  isForMechanics ? 'bg-white/70' : 'bg-[#7C4DFF]'
                }`} />
              </Link>
            </div>

            {/* 오른쪽: 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/#map" className="px-4 py-2 text-sm text-gray-600 hover:text-[#7C4DFF] transition-colors rounded-lg hover:bg-[#7C4DFF]/5 font-medium">
                서비스
              </Link>
              <Link href="/for-mechanics" className="px-4 py-2 text-sm text-gray-600 hover:text-[#7C4DFF] transition-colors rounded-lg hover:bg-[#7C4DFF]/5 font-medium">
                정비사 사장님
              </Link>
              <Link href="/youtube-idea" className="px-4 py-2 text-sm text-gray-600 hover:text-[#7C4DFF] transition-colors rounded-lg hover:bg-[#7C4DFF]/5 font-medium">
                유튜브 기획
              </Link>
              <Link href="/inquiry" className="px-4 py-2 text-sm text-gray-600 hover:text-[#7C4DFF] transition-colors rounded-lg hover:bg-[#7C4DFF]/5 font-medium">
                문의하기
              </Link>

              {/* 구분선 */}
              <div className="w-px h-5 bg-gray-200 mx-2" />

              <Link
                href="/owner/login"
                className="px-4 py-2 text-sm text-[#7C4DFF] hover:bg-[#7C4DFF]/5 transition-colors rounded-lg font-semibold"
              >
                사장님 로그인
              </Link>
            </nav>

            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#7C4DFF] transition-colors rounded-lg"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 — 풀스크린 오버레이 */}
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
                    href="/youtube-idea"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 text-base text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                  >
                    유튜브 기획
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
      </header>

      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="bg-[#1A0A2E] py-10 md:py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white/60 text-sm">
            © 2025 꿈꾸는정비사. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
