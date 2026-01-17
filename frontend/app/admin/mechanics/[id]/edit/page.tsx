'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import MechanicForm from '@/components/admin/MechanicForm';
import type { Mechanic } from '@/types';

export default function EditMechanicPage() {
  const params = useParams();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanic = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${params.id}`
        );
        if (!response.ok) throw new Error('데이터 로드 실패');
        const data = await response.json();
        setMechanic(data);
      } catch (error) {
        console.error(error);
        alert('정비사 정보를 불러오는데 실패했습니다.');
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!mechanic) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">정비사를 찾을 수 없습니다.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">정비사 수정</h1>
        <MechanicForm mechanic={mechanic} mode="edit" />
      </div>
    </AdminLayout>
  );
}
