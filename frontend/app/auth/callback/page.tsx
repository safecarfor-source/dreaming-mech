'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/lib/auth';
import { userAuthApi } from '@/lib/api';

// 공유 링크 URL에서 문의 ID 추출 (/inquiry/service/42 → { type: 'service', id: 42 })
function parseInquiryUrl(url: string): { type: string; id: number } | null {
  const match = url.match(/\/inquiry\/(\w+)\/(\d+)/);
  if (match) return { type: match[1], id: Number(match[2]) };
  // 레거시 URL: /inquiry/42
  const legacy = url.match(/\/inquiry\/(\d+)$/);
  if (legacy) return { type: 'service', id: Number(legacy[1]) };
  return null;
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUserStore();
  const businessStatus = searchParams.get('businessStatus');
  const from = searchParams.get('from');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // 5초 타임아웃: 응답 없으면 에러 화면으로 전환
    const timeoutId = setTimeout(() => {
      setTimedOut(true);
    }, 5000);

    const fetchProfile = async () => {
      try {
        const res = await userAuthApi.getProfile();
        clearTimeout(timeoutId);
        const userData = res.data;
        login(userData);

        // sessionStorage에서 returnUrl 확인
        const returnUrl = typeof window !== 'undefined'
          ? sessionStorage.getItem('mechanic_return_url')
          : null;

        if (returnUrl) {
          sessionStorage.removeItem('mechanic_return_url');
          sessionStorage.setItem('mechanic_just_signed_up', 'true');
          // 문의 링크에서 가입했으면 해당 문의 ID 연결 (추적용)
          const inquiryInfo = parseInquiryUrl(returnUrl);
          if (inquiryInfo) {
            userAuthApi.setSignupInquiry(inquiryInfo.id).catch(() => {});
          }
          router.replace(returnUrl);
          return;
        }

        // businessStatus에 따라 리다이렉트
        const status = userData.businessStatus || businessStatus;
        if (status === 'NONE') {
          // from=owner 파라미터가 있으면 정비사 온보딩으로, 없으면 홈으로
          if (from === 'owner') {
            router.replace('/owner/onboarding');
          } else {
            router.replace('/');
          }
        } else {
          // PENDING/APPROVED/REJECTED → 사장님 대시보드
          router.replace('/owner');
        }
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        console.error('로그인 프로필 조회 실패:', error);
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 401) {
          router.replace('/login?error=cookie_failed');
        } else {
          router.replace('/login?error=profile_failed');
        }
      }
    };

    fetchProfile();

    return () => clearTimeout(timeoutId);
  }, [login, router, businessStatus, from]);

  // 5초 타임아웃 후 에러 UI 표시
  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-gray-800 font-medium mb-2">로그인에 실패했습니다</p>
          <p className="text-gray-500 text-sm mb-6">서버 응답이 없습니다. 다시 시도해주세요.</p>
          <button
            onClick={() => router.replace('/login')}
            className="px-6 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C4DFF] mx-auto mb-4" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
