'use client';

import { useEffect, Suspense } from 'react';
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAuthApi.getProfile();
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
  }, [login, router, businessStatus, from]);

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
