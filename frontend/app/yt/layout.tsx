'use client';

import { useState, useEffect } from 'react';
import { Youtube } from 'lucide-react';
import YtAuthGate from './components/YtAuthGate';

export default function YtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 저장된 토큰 확인
    const token = localStorage.getItem('yt_auth_token');
    if (token) {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleAuth = (token: string) => {
    localStorage.setItem('yt_auth_token', token);
    setAuthenticated(true);
  };

  // 초기 토큰 확인 중
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 미인증 상태
  if (!authenticated) {
    return <YtAuthGate onAuth={handleAuth} />;
  }

  // 인증 완료
  return (
    <div className="min-h-screen bg-gray-950 font-[Pretendard,sans-serif]">
      {/* 상단 네비게이션 */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">
              유튜브 서포터
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('yt_auth_token');
              setAuthenticated(false);
            }}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <main>{children}</main>
    </div>
  );
}
