'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Share2,
  Phone,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { serviceInquiryApi } from '@/lib/api';
import { ServiceInquiry, ServiceInquiryStatus } from '@/types';

type TabType = 'ALL' | ServiceInquiryStatus;

const SERVICE_TYPE_MAP: Record<string, { label: string; emoji: string }> = {
  TIRE: { label: '타이어', emoji: '🛞' },
  OIL: { label: '엔진오일', emoji: '🛢️' },
  BRAKE: { label: '브레이크', emoji: '🔴' },
  MAINTENANCE: { label: '경정비', emoji: '🔧' },
  CONSULT: { label: '종합상담', emoji: '💬' },
};

const STATUS_LABELS: Record<ServiceInquiryStatus, string> = {
  PENDING: '대기중',
  SHARED: '공유됨',
  CONNECTED: '연결됨',
  COMPLETED: '완료',
};

const STATUS_COLORS: Record<ServiceInquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SHARED: 'bg-blue-100 text-blue-700',
  CONNECTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
};

export default function AdminServiceInquiriesPage() {
  const [tab, setTab] = useState<TabType>('ALL');
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceInquiryApi.getAll(page, 20);
      const data = res.data.data;

      let filtered = data.data;
      if (tab !== 'ALL') {
        filtered = filtered.filter((inq) => inq.status === tab);
      }

      setInquiries(filtered);
      setTotal(filtered.length);
      setTotalPages(Math.ceil(filtered.length / 20));
    } catch (error) {
      console.error('서비스 문의 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    setPage(1);
  };

  const handleStatusChange = async (id: number, status: ServiceInquiryStatus) => {
    try {
      await serviceInquiryApi.updateStatus(id, status);
      fetchInquiries();
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleCopyLink = async (id: number) => {
    const link = `https://dreammechaniclab.com/inquiry/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleCopyShareMessage = async (id: number) => {
    try {
      const res = await serviceInquiryApi.getShareMessage(id);
      const message = typeof res.data === 'string' ? res.data : res.data.data;
      if (typeof message === 'string') {
        await navigator.clipboard.writeText(message);
        setCopiedMessage(id);
        setTimeout(() => setCopiedMessage(null), 2000);
      }
    } catch (error) {
      console.error('공유 메시지 복사 실패:', error);
      alert('공유 메시지 복사에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
  };

  const getStatCount = (status?: ServiceInquiryStatus) => {
    if (!status) return inquiries.length;
    return inquiries.filter((inq) => inq.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">서비스 문의 관리</h1>
          <span className="text-sm text-gray-500">총 {total}건</span>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 flex-wrap">
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
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {getStatCount()}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('PENDING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'PENDING'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Clock size={16} />
            대기중
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {getStatCount('PENDING')}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('SHARED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'SHARED'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Share2 size={16} />
            공유됨
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {getStatCount('SHARED')}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('CONNECTED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'CONNECTED'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Phone size={16} />
            연결됨
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {getStatCount('CONNECTED')}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('COMPLETED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'COMPLETED'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle size={16} />
            완료
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {getStatCount('COMPLETED')}
            </span>
          </button>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">서비스 문의가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      지역
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      서비스 항목
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      전화번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      접수일시
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inquiries.map((inquiry) => {
                    const serviceInfo = SERVICE_TYPE_MAP[inquiry.serviceType] || {
                      label: inquiry.serviceType,
                      emoji: '📋',
                    };
                    return (
                      <tr key={inquiry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{inquiry.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {inquiry.regionSido} {inquiry.regionSigungu}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <span>{serviceInfo.emoji}</span>
                            <span className="text-gray-900">{serviceInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(inquiry as any).phone || inquiry.customer?.phone ? (
                            <a
                              href={`tel:${(inquiry as any).phone || inquiry.customer?.phone}`}
                              className="text-purple-600 hover:underline"
                            >
                              {(inquiry as any).phone || inquiry.customer?.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">비공개</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(inquiry.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={inquiry.status}
                            onChange={(e) =>
                              handleStatusChange(
                                inquiry.id,
                                e.target.value as ServiceInquiryStatus
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-medium border-0 ${
                              STATUS_COLORS[inquiry.status]
                            }`}
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyLink(inquiry.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            >
                              {copiedId === inquiry.id ? (
                                <>
                                  <Check size={14} />
                                  복사됨
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  링크 복사
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyShareMessage(inquiry.id)}
                              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                copiedMessage === inquiry.id
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-[#FEE500] text-gray-800 hover:bg-[#FDD835]'
                              }`}
                            >
                              {copiedMessage === inquiry.id ? '✓ 복사됨' : '📋 공유 메시지'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
      </div>
    </AdminLayout>
  );
}
