'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function KakaoButton() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? 'owner';

  const kakaoLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao?from=${from}`;

  return (
    <a
      href={kakaoLoginUrl}
      className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base transition-all duration-150 active:scale-[0.98]"
      style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
    >
      {/* 카카오 로고 */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3C6.477 3 2 6.58 2 11c0 2.77 1.63 5.2 4.1 6.72-.17.6-.62 2.16-.71 2.5-.11.4.15.4.31.29l3.13-2.06c.68.1 1.38.15 2.17.15 5.523 0 10-3.58 10-8S17.523 3 12 3z" />
      </svg>
      카카오로 시작하기
    </a>
  );
}

export default function ProLoginPage() {
  return (
    <div className="max-w-[520px] mx-auto min-h-[calc(100svh-56px)] flex flex-col justify-center px-5 py-12">
      {/* 뒤로가기 */}
      <Link
        href="/pro"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-12 transition-colors self-start"
      >
        <ArrowLeft size={16} />
        돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-10">
        <p
          className="text-xs font-semibold tracking-[0.15em] uppercase mb-3"
          style={{ color: '#D4AF37' }}
        >
          정비사 전용
        </p>
        <h1 className="text-white font-black text-2xl leading-tight break-keep">
          브랜딩 된 정비소로
          <br />
          <span style={{ color: '#D4AF37' }}>지금 시작하세요</span>
        </h1>
        <p className="text-white/40 text-sm mt-3 leading-[1.65] break-keep">
          카카오 계정으로 1초 만에 가입할 수 있습니다.
          <br />
          별도 회원가입 없이 바로 시작됩니다.
        </p>
      </div>

      {/* 카카오 버튼 */}
      <Suspense
        fallback={
          <button
            disabled
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base opacity-70"
            style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
          >
            카카오로 시작하기
          </button>
        }
      >
        <KakaoButton />
      </Suspense>

      {/* 안내 문구 */}
      <p className="text-white/25 text-[11px] text-center mt-5 leading-[1.6]">
        가입 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
      </p>

      {/* 구분선 */}
      <div className="flex items-center gap-3 my-8">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <span className="text-white/20 text-xs">또는</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* 기존 대시보드 링크 */}
      <Link
        href="/owner"
        className="text-center text-sm transition-colors"
        style={{ color: 'rgba(212,175,55,0.6)' }}
      >
        기존 대시보드로 이동하기 →
      </Link>
    </div>
  );
}
