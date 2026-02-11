'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminOwnerApi } from '@/lib/api';
import { Owner } from '@/types';
import { Check, X, Clock, UserCheck, UserX } from 'lucide-react';

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fetchOwners = async () => {
    try {
      const res = await adminOwnerApi.getAll(filter === 'all' ? undefined : filter);
      setOwners(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOwners();
  }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm('이 사장님을 승인하시겠습니까?')) return;
    try {
      await adminOwnerApi.approve(id);
      fetchOwners();
    } catch {
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('이 사장님을 거절하시겠습니까?')) return;
    try {
      await adminOwnerApi.reject(id);
      fetchOwners();
    } catch {
      alert('거절에 실패했습니다.');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <Clock size={12} /> 대기
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <UserCheck size={12} /> 승인
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <UserX size={12} /> 거절
          </span>
        );
      default:
        return null;
    }
  };

  const providerLabel = (provider: string) => {
    return provider === 'naver' ? (
      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">네이버</span>
    ) : (
      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">카카오</span>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사장님 관리</h1>
        <p className="text-gray-500 mt-1">회원가입 요청을 승인/거절합니다</p>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: '전체' },
          { value: 'PENDING', label: '대기중' },
          { value: 'APPROVED', label: '승인됨' },
          { value: 'REJECTED', label: '거절됨' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as FilterStatus)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">로딩 중...</div>
      ) : owners.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">해당하는 사장님이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">사장님</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">이메일</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">가입방식</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">매장수</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {owners.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {owner.profileImage ? (
                        <img
                          src={owner.profileImage}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          {owner.name?.[0] || '?'}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {owner.name || '(이름 없음)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {owner.email || '-'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {providerLabel(owner.provider)}
                  </td>
                  <td className="px-6 py-4">{statusBadge(owner.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {owner._count?.mechanics || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {owner.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(owner.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="승인"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(owner.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="거절"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    {owner.status === 'REJECTED' && (
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        재승인
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
