'use client';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-[#8B5CF6]">꿈꾸는</span>정비사
          </h1>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#888888]">
            <a href="#" className="hover:text-white transition-colors">서비스</a>
            <a href="#" className="hover:text-white transition-colors">정비사 목록</a>
            <a href="#" className="hover:text-white transition-colors">문의하기</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="bg-[#111111] border-t border-white/5 py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[#888888] text-sm">
            © 2025 꿈꾸는정비사. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
