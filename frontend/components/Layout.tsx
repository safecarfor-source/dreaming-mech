'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForMechanics = pathname === '/for-mechanics';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-5">
            <Link href="/">
              <h1 className="text-2xl md:text-4xl font-bold">
                <span>꿈꾸는<span className="text-[#bf00ff]"> 정비사</span></span>
              </h1>
            </Link>
            {/* 정비사 전용 탭 (크몽 Biz 스타일) - 토글 기능 */}
            <Link
              href={isForMechanics ? '/' : '/for-mechanics'}
              className={`flex items-center gap-2 md:gap-3 ml-1 md:ml-3 px-4 py-2 md:px-6 md:py-3 rounded-full border-2 transition-all group ${
                isForMechanics
                  ? 'border-[#bf00ff] bg-[#bf00ff]/15'
                  : 'border-white/20 hover:border-[#bf00ff]/50 hover:bg-[#bf00ff]/10'
              }`}
            >
              <span className={`text-sm md:text-lg font-bold transition-colors ${
                isForMechanics ? 'text-[#bf00ff]' : 'text-gray-400 group-hover:text-[#bf00ff]'
              }`}>타이어 사장만 들어오세요!!</span>
              <span className={`w-7 h-4 md:w-10 md:h-6 rounded-full relative transition-colors ${
                isForMechanics ? 'bg-[#bf00ff]' : 'bg-gray-600 group-hover:bg-[#bf00ff]'
              }`}>
                <span className={`absolute top-0.5 w-3 h-3 md:w-5 md:h-5 bg-white rounded-full transition-all ${
                  isForMechanics ? 'right-0.5' : 'left-0.5'
                }`} />
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">서비스</a>
            <a href="#" className="hover:text-white transition-colors">정비사 목록</a>
            <a href="#" className="hover:text-white transition-colors">문의하기</a>
            <a href="/owner/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">사장님 로그인</a>
          </nav>
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
