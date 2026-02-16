'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { quoteRequestApi } from '@/lib/api';
import type { QuoteRequest } from '@/types';
import { FileText, Clock, Eye, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: '대기', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  VIEWED: { label: '확인', color: 'bg-blue-100 text-blue-700', icon: Eye },
  REPLIED: { label: '답변', color: 'bg-green-100 text-green-700', icon: MessageCircle },
  COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminQuoteRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      const response = await quoteRequestApi.getAll(params);
      setRequests(response.data.data);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('견적 요청 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, filter]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await quoteRequestApi.updateStatus(id, status);
      fetchRequests();
      if (selected?.id === id) {
        setSelected({ ...selected, status: status as any });
      }
    } catch (error) {
      alert('상태 변경 실패');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-purple-600" />
          견적 요청 관리
        </h1>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: '', label: '전체' },
          { value: 'PENDING', label: '대기' },
          { value: 'VIEWED', label: '확인' },
          { value: 'REPLIED', label: '답변' },
          { value: 'COMPLETED', label: '완료' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 + 상세 */}
      <div className="flex gap-6">
        {/* 왼쪽: 목록 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">견적 요청이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => {
                const statusInfo = STATUS_MAP[req.status];
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelected(req)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selected?.id === req.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                    } ${req.status === 'PENDING' ? 'border-l-4 border-l-yellow-400' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{req.customerName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color || ''}`}>
                        {statusInfo?.label || req.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{req.carModel}</div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{req.mechanic?.name || `정비소 #${req.mechanicId}`}</span>
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-500 py-1">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 */}
        {selected && (
          <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">견적 요청 상세</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">고객:</span>
                <span className="ml-2 font-medium text-gray-900">{selected.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">연락처:</span>
                <a href={`tel:${selected.customerPhone}`} className="ml-2 text-purple-600 hover:underline">
                  {selected.customerPhone}
                </a>
              </div>
              <div>
                <span className="text-gray-500">차종:</span>
                <span className="ml-2 text-gray-900">{selected.carModel}</span>
                {selected.carYear && <span className="ml-1 text-gray-400">({selected.carYear})</span>}
              </div>
              <div>
                <span className="text-gray-500">정비소:</span>
                <span className="ml-2 text-gray-900">{selected.mechanic?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">알림톡:</span>
                <span className={`ml-2 ${selected.alimtalkSent ? 'text-green-600' : 'text-gray-400'}`}>
                  {selected.alimtalkSent ? '발송됨' : '미발송'}
                </span>
              </div>
            </div>

            {/* 증상 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
            </div>

            {/* 첨부 사진 */}
            {selected.images && selected.images.length > 0 && (
              <div className="flex gap-2">
                {(selected.images as string[]).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  </a>
                ))}
              </div>
            )}

            {/* 상태 변경 */}
            <div>
              <span className="text-sm text-gray-500 mb-2 block">상태 변경:</span>
              <div className="flex flex-wrap gap-2">
                {['VIEWED', 'REPLIED', 'COMPLETED', 'CANCELLED'].map((status) => {
                  const info = STATUS_MAP[status];
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selected.id, status)}
                      disabled={selected.status === status}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected.status === status
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
