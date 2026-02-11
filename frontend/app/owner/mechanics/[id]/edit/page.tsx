'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OwnerLayout from '@/components/owner/OwnerLayout';
import MechanicForm from '@/components/admin/MechanicForm';
import type { Mechanic } from '@/types';

export default function OwnerEditMechanicPage() {
  const params = useParams();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanic = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${params.id}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('데이터 로드 실패');
        const data = await response.json();
        setMechanic(data);
      } catch (error) {
        console.error(error);
        alert('매장 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMechanic();
    }
  }, [params.id]);

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </OwnerLayout>
    );
  }

  if (!mechanic) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">매장을 찾을 수 없습니다.</div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">매장 수정</h1>
        <MechanicForm
          mechanic={mechanic}
          mode="edit"
          apiBasePath="/owner/mechanics"
          redirectPath="/owner/mechanics"
        />
      </div>
    </OwnerLayout>
  );
}
