'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            정비소 사장님 로그인
          </h1>
          <p className="text-gray-500 text-sm">
            소셜 계정으로 간편하게 로그인하세요
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        <div className="space-y-4">
          <a
            href={`${apiUrl}/auth/kakao`}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#FEE500] text-[#191919] font-semibold rounded-lg hover:bg-[#fdd800] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.48 0 0 3.58 0 8c0 2.83 1.88 5.32 4.7 6.72-.15.56-.97 3.56-.99 3.78 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.11.11 1.68.11 5.52 0 10-3.58 10-8S15.52 0 10 0" />
            </svg>
            카카오로 로그인
          </a>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            처음 로그인하시면 자동으로 가입됩니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            관리자 승인 후 매장을 등록할 수 있습니다.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            메인으로 돌아가기
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
