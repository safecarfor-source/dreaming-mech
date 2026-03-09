'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 쿼리파라미터 그대로 전달
    const params = searchParams.toString();
    router.replace(params ? `/auth/callback?${params}` : '/auth/callback');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C4DFF] mx-auto mb-4" />
        <p className="text-gray-600">리다이렉트 중...</p>
      </div>
    </div>
  );
}

export default function OwnerCallbackPage() {
  return (
    <Suspense>
      <RedirectContent />
    </Suspense>
  );
}
