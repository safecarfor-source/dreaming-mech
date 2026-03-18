'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OwnerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const from = searchParams.get('from');
    const destination = from ? `/login?from=${from}` : '/login';
    router.replace(destination);
  }, [router, searchParams]);

  return null;
}

export default function OwnerLoginPage() {
  return (
    <Suspense>
      <OwnerLoginContent />
    </Suspense>
  );
}
