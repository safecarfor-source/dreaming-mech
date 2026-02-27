'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCustomerApi } from '@/lib/api';
import { Users, Phone, Calendar, MessageSquare, Trash2, Search } from 'lucide-react';

interface CustomerItem {
  id: number;
  kakaoId: string;
  nickname?: string;
  email?: string;
  phone?: string;
  trackingCode?: string;
  createdAt: string;
  _count: { serviceInquiries: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await adminCustomerApi.getAll();
      setCustomers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: number, nickname?: string) => {
    if (!confirm(`'${nickname || '이 고객'}'을 강제 탈퇴시키겠습니까?\n관련 문의 내역도 모두 삭제됩니다.`)) return;
    setDeleting(id);
    try {
      await adminCustomerApi.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('탈퇴 처리에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.nickname || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">고객 현황</h1>
            <p className="text-sm text-gray-500 mt-1">
              카카오 로그인으로 가입한 고객 {customers.length}명
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#7C4DFF]/10 text-[#7C4DFF] px-4 py-2 rounded-xl font-semibold">
            <Users size={18} />
            총 {customers.length}명
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 전화번호, 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] bg-white"
          />
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{searchQuery ? '검색 결과가 없습니다.' : '아직 가입한 고객이 없습니다.'}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {/* 아바타 */}
                  <div className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 flex items-center justify-center text-[#7C4DFF] font-bold text-lg">
                    {(customer.nickname || '?')[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {customer.nickname || '닉네임 없음'}
                      </span>
                      {customer._count.serviceInquiries > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                          <MessageSquare size={10} />
                          문의 {customer._count.serviceInquiries}건
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone size={13} />
                        {customer.phone || '전화번호 미입력'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(customer.createdAt).toLocaleDateString('ko-KR')} 가입
                      </span>
                    </div>

                    {customer.email && (
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    )}
                    {customer.trackingCode && (
                      <div className="text-xs text-purple-500">
                        유입: {customer.trackingCode}
                      </div>
                    )}
                  </div>
                </div>

                {/* 강제 탈퇴 버튼 */}
                <button
                  onClick={() => handleDelete(customer.id, customer.nickname)}
                  disabled={deleting === customer.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  {deleting === customer.id ? '처리 중...' : '강제 탈퇴'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 법적 안내 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>강제 탈퇴 안내:</strong> 강제 탈퇴 시 해당 고객의 모든 문의 내역이 삭제됩니다.
          이용약관에 명시된 경우에 한해 집행하시기 바랍니다.
        </div>
      </div>
    </AdminLayout>
  );
}
