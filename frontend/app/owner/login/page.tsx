'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Shield, Phone, Clock, ArrowRight } from 'lucide-react';
import { gtagEvent } from '@/lib/gtag-events';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [fromInquiry, setFromInquiry] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const returnUrl = sessionStorage.getItem('mechanic_return_url');
      setFromInquiry(!!returnUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-purple-100/40 flex items-center justify-center px-4 py-12">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-purple-100/50 mb-6">
            <Shield size={16} className="text-[#7C4DFF]" />
            <span className="text-sm font-medium text-gray-700">꿈꾸는정비사 검증 플랫폼</span>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-purple-100/50 border border-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {fromInquiry ? '고객 전화번호 확인' : '정비소 사장님 로그인'}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {fromInquiry
                ? '카카오 로그인으로 고객과 바로 연결하세요'
                : '카카오 계정으로 간편하게 시작하세요'}
            </p>
          </div>

          {/* 문의에서 온 경우: 혜택 안내 */}
          {fromInquiry && (
            <div className="mb-6 space-y-2">
              {[
                { icon: Clock, text: '가입 3초, 완전 무료' },
                { icon: Phone, text: '고객 전화번호 즉시 확인' },
                { icon: ArrowRight, text: '바로 전화 연결 가능' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-4 py-2.5 bg-purple-50/60 rounded-xl">
                  <Icon size={16} className="text-[#7C4DFF] flex-shrink-0" />
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          {/* 카카오 로그인 버튼 */}
          <a
            href={`${apiUrl}/auth/kakao`}
            onClick={() => gtagEvent.ownerLoginStart()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#FEE500] text-[#191919] font-bold rounded-xl hover:bg-[#F5D800] active:scale-[0.98] transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 3.58 0 8c0 2.83 1.88 5.32 4.7 6.72-.15.56-.97 3.56-.99 3.78 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.11.11 1.68.11 5.52 0 10-3.58 10-8S15.52 0 10 0" />
            </svg>
            카카오로 {fromInquiry ? '3초 가입' : '로그인'}
          </a>

          {/* 안내 문구 */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-gray-500">
              처음 로그인하시면 자동으로 가입됩니다
            </p>
            {!fromInquiry && (
              <p className="text-xs text-gray-500">
                관리자 승인 후 매장을 등록할 수 있습니다
              </p>
            )}
          </div>
        </div>

        {/* 메인으로 돌아가기 */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-[#7C4DFF] transition-colors">
            ← 메인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
