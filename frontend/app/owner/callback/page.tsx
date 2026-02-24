'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOwnerStore } from '@/lib/auth';
import { ownerAuthApi } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useOwnerStore();
  const status = searchParams.get('status');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await ownerAuthApi.getProfile();
        login(res.data);

        // 공유 링크에서 왔으면 원래 문의로 복귀
        const returnUrl = typeof window !== 'undefined'
          ? sessionStorage.getItem('mechanic_return_url')
          : null;

        if (returnUrl) {
          sessionStorage.removeItem('mechanic_return_url');
          sessionStorage.setItem('mechanic_just_signed_up', 'true');
          router.replace(returnUrl);
        } else if (status === 'REJECTED') {
          router.replace('/owner?rejected=true');
        } else {
          router.replace('/owner');
        }
      } catch {
        router.replace('/owner/login?error=profile_failed');
      }
    };

    fetchProfile();
  }, [login, router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function OwnerCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
