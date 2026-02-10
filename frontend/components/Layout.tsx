'use client';

import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-xl font-bold">
                <span>꿈꾸는<span className="text-[#bf00ff]"> 정비사</span></span>
              </h1>
            </Link>
            {/* 정비사 전용 탭 (크몽 Biz 스타일) */}
            <Link
              href="/for-mechanics"
              className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-full border border-white/20 hover:border-[#bf00ff]/50 hover:bg-[#bf00ff]/10 transition-all group"
            >
              <span className="text-xs font-semibold text-gray-400 group-hover:text-[#bf00ff] transition-colors">정비사 전용</span>
              <span className="w-5 h-3 bg-gray-600 rounded-full relative group-hover:bg-[#bf00ff] transition-colors">
                <span className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
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
