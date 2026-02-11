'use client';

import { useEffect, useState } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerMechanicsApi } from '@/lib/api';
import { Mechanic } from '@/types';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function OwnerMechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMechanics = async () => {
    try {
      const res = await ownerMechanicsApi.getAll();
      setMechanics(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 매장을 삭제하시겠습니까?`)) return;
    try {
      await ownerMechanicsApi.delete(id);
      fetchMechanics();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <OwnerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 매장 관리</h1>
        <Link
          href="/owner/mechanics/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus size={16} />
          매장 추가
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">로딩 중...</div>
      ) : mechanics.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">등록된 매장이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">매장명</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">주소</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">조회수</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mechanics.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-sm text-gray-500 md:hidden">{m.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{m.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{m.clickCount}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/owner/mechanics/${m.id}/edit`}
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id, m.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OwnerLayout>
  );
}
