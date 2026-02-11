'use client';

import { useEffect, useState } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerMechanicsApi } from '@/lib/api';
import { Mechanic } from '@/types';
import Link from 'next/link';
import { Plus, Store, Eye } from 'lucide-react';

export default function OwnerDashboardPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ownerMechanicsApi.getAll();
        setMechanics(res.data);
      } catch {
        // 에러 무시 (OwnerLayout에서 인증 처리)
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <OwnerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">내 매장을 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Store size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">등록된 매장</p>
              <p className="text-2xl font-bold">{mechanics.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 조회수</p>
              <p className="text-2xl font-bold">
                {mechanics.reduce((sum, m) => sum + m.clickCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-center">
          <Link
            href="/owner/mechanics/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            새 매장 등록
          </Link>
        </div>
      </div>

      {/* 매장 목록 */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">로딩 중...</div>
      ) : mechanics.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">아직 등록된 매장이 없습니다.</p>
          <Link
            href="/owner/mechanics/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={18} />
            첫 매장 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mechanics.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.address}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    조회수: {m.clickCount}
                  </p>
                </div>
                <Link
                  href={`/owner/mechanics/${m.id}/edit`}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  수정
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
