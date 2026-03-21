'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InquiryCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/callback');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4015C] mx-auto mb-4" />
        <p className="text-gray-600">처리 중...</p>
      </div>
    </div>
  );
}
