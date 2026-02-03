'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import type { Mechanic } from '@/types';

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const response = await mechanicsApi.getAll();
      setMechanics(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;

    try {
      await mechanicsApi.delete(id);
      setMechanics((prev) => prev.filter((m) => m.id !== id));
      alert('삭제되었습니다.');
    } catch (error) {
      console.error(error);
      alert('삭제에 실패했습니다.');
    }
  };

  const filteredMechanics = mechanics.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">정비사 관리</h1>
            <p className="text-gray-500 mt-1">
              등록된 정비사: {mechanics.length}개
            </p>
          </div>
          <Link
            href="/admin/mechanics/new"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus size={20} />
            정비사 추가
          </Link>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 지역으로 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
          />
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    정비소
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    지역
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    전화번호
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    조회수
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    상태
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredMechanics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {search ? '검색 결과가 없습니다.' : '등록된 정비사가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredMechanics.map((mechanic) => (
                    <tr key={mechanic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                            {mechanic.mainImageUrl ? (
                              <img
                                src={mechanic.mainImageUrl}
                                alt={mechanic.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                없음
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {mechanic.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{mechanic.location}</td>
                      <td className="px-6 py-4 text-gray-600">{mechanic.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-purple-600">
                          <Eye size={16} />
                          <span>{mechanic.clickCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            mechanic.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {mechanic.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/mechanics/${mechanic.id}/edit`}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-600/5 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(mechanic.id, mechanic.name)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
