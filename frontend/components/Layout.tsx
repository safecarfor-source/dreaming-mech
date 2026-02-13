'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForMechanics = pathname === '/for-mechanics';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* 네비게이션 - 크몽 스타일 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* 왼쪽: 로고 + 뱃지 */}
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="flex items-center gap-1">
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                  꿈꾸는<span className="text-[#bf00ff]">정비사</span>
                </span>
              </Link>

              {/* 구분선 */}
              <div className="hidden md:block w-px h-5 bg-white/20" />

              {/* 정비사 전용 뱃지 - 토글 */}
              <Link
                href={isForMechanics ? '/' : '/for-mechanics'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  isForMechanics
                    ? 'bg-[#bf00ff] text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-[#bf00ff]/20 hover:text-[#bf00ff]'
                }`}
              >
                정비사 전용
                <span className={`inline-block w-2 h-2 rounded-full ${
                  isForMechanics ? 'bg-white' : 'bg-green-400'
                }`} />
              </Link>
            </div>

            {/* 오른쪽: 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/#map" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 font-medium">
                서비스
              </Link>
              <Link href="/for-mechanics" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 font-medium">
                정비사 사장님 클릭!
              </Link>
              <Link href="/inquiry" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 font-medium">
                문의하기
              </Link>

              {/* 구분선 */}
              <div className="w-px h-5 bg-white/20 mx-2" />

              <Link
                href="/owner/login"
                className="px-4 py-2 text-sm text-[#bf00ff] hover:bg-[#bf00ff]/10 transition-colors rounded-lg font-semibold"
              >
                사장님 로그인
              </Link>
            </nav>

            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* 모바일 메뉴 드롭다운 */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-3 space-y-1">
              <Link href="/#map" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-medium">
                서비스
              </Link>
              <Link href="/for-mechanics" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-medium">
                정비사 사장님 클릭!
              </Link>
              <Link href="/inquiry" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-medium">
                문의하기
              </Link>
              <div className="border-t border-white/10 my-2" />
              <Link
                href="/owner/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-[#bf00ff] hover:bg-[#bf00ff]/10 rounded-lg font-semibold"
              >
                사장님 로그인
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="bg-[#111111] border-t border-white/5 py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 꿈꾸는정비사. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
