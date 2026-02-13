'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Users,
  Wrench,
  Eye,
  Trash2,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { inquiryApi } from '@/lib/api';
import { Inquiry } from '@/types';

type TabType = 'ALL' | 'CUSTOMER' | 'MECHANIC';

export default function AdminInquiriesPage() {
  const [tab, setTab] = useState<TabType>('ALL');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [unreadCount, setUnreadCount] = useState({ customer: 0, mechanic: 0, total: 0 });

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (tab !== 'ALL') params.type = tab;
      const res = await inquiryApi.getAll(params);
      setInquiries(res.data.data);
      setTotal(res.data.meta?.total || 0);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      console.error('문의 목록 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await inquiryApi.getUnreadCount();
      setUnreadCount(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchInquiries();
    fetchUnreadCount();
  }, [fetchInquiries, fetchUnreadCount]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    setPage(1);
  };

  const handleSelectInquiry = async (inquiry: Inquiry) => {
    try {
      const res = await inquiryApi.getOne(inquiry.id);
      setSelectedInquiry(res.data);
      setReplyText(res.data.reply || '');
      fetchUnreadCount();
      fetchInquiries();
    } catch {}
  };

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await inquiryApi.reply(selectedInquiry.id, replyText.trim());
      setSelectedInquiry(res.data);
      fetchInquiries();
      fetchUnreadCount();
    } catch {
      alert('답변 저장에 실패했습니다.');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 문의를 삭제하시겠습니까?')) return;
    try {
      await inquiryApi.delete(id);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      fetchInquiries();
      fetchUnreadCount();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
          <span className="text-sm text-gray-500">총 {total}건</span>
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare size={16} />
            전체
            {unreadCount.total > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount.total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('CUSTOMER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'CUSTOMER'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users size={16} />
            일반 문의
            {unreadCount.customer > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount.customer}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('MECHANIC')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'MECHANIC'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wrench size={16} />
            정비사 문의
            {unreadCount.mechanic > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount.mechanic}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 목록 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">로딩 중...</div>
            ) : inquiries.length === 0 ? (
              <div className="p-8 text-center text-gray-400">문의가 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    onClick={() => handleSelectInquiry(inquiry)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedInquiry?.id === inquiry.id ? 'bg-purple-50' : ''
                    } ${!inquiry.isRead ? 'border-l-4 border-l-purple-600' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inquiry.type === 'CUSTOMER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {inquiry.type === 'CUSTOMER' ? '일반' : '정비사'}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">
                          {inquiry.name}
                        </span>
                        {inquiry.businessName && (
                          <span className="text-xs text-gray-500">
                            ({inquiry.businessName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {inquiry.reply && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            답변완료
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{inquiry.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{inquiry.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* 상세 / 답변 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {selectedInquiry ? (
              <div className="flex flex-col h-full">
                {/* 상세 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedInquiry.type === 'CUSTOMER'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {selectedInquiry.type === 'CUSTOMER' ? '일반 문의' : '정비사 문의'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {formatDate(selectedInquiry.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(selectedInquiry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* 문의 내용 */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">이름</span>
                      <span className="font-medium text-gray-900">{selectedInquiry.name}</span>
                    </div>
                    {selectedInquiry.businessName && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">상호명</span>
                        <span className="font-medium text-gray-900">{selectedInquiry.businessName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">연락처</span>
                      <a href={`tel:${selectedInquiry.phone}`} className="font-medium text-purple-600 hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1 font-medium">문의 내용</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedInquiry.content}</p>
                  </div>

                  {/* 기존 답변 */}
                  {selectedInquiry.reply && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1 font-medium">
                        답변 ({selectedInquiry.repliedAt ? formatDate(selectedInquiry.repliedAt) : ''})
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedInquiry.reply}</p>
                    </div>
                  )}
                </div>

                {/* 답변 작성 */}
                <div className="p-4 border-t border-gray-100">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변을 작성하세요..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Send size={14} />
                    {replying ? '저장 중...' : selectedInquiry.reply ? '답변 수정' : '답변 저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Eye size={40} className="mx-auto mb-3 opacity-30" />
                <p>문의를 선택하면 상세 내용을 볼 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
