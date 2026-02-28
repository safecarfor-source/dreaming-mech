'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Clock,
  Share2,
  Phone,
  CheckCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Wrench,
  Link2,
  X,
  Eye,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { unifiedInquiryApi } from '@/lib/api';
import type { UnifiedInquiry } from '@/types';

const SERVICE_TYPE_MAP: Record<string, { label: string; emoji: string }> = {
  TIRE: { label: '타이어', emoji: '🛞' },
  OIL: { label: '엔진오일', emoji: '🛢️' },
  BRAKE: { label: '브레이크', emoji: '🔴' },
  MAINTENANCE: { label: '경정비', emoji: '🔧' },
  CONSULT: { label: '종합상담', emoji: '💬' },
};

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  SERVICE: { label: '서비스', color: 'bg-purple-100 text-purple-700', icon: Wrench },
  GENERAL: { label: '일반', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  QUOTE: { label: '견적', color: 'bg-amber-100 text-amber-700', icon: FileText },
  TIRE: { label: '타이어', color: 'bg-green-100 text-green-700', icon: Wrench },
};

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기중' },
  { value: 'SHARED', label: '공유됨' },
  { value: 'CONNECTED', label: '연결됨' },
  { value: 'COMPLETED', label: '완료' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SHARED: 'bg-blue-100 text-blue-700',
  CONNECTED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
};

type FilterType = 'ALL' | 'SERVICE' | 'GENERAL' | 'QUOTE' | 'TIRE';

export default function UnifiedInquiriesPage() {
  const [inquiries, setInquiries] = useState<UnifiedInquiry[]>([]);
  const [allInquiries, setAllInquiries] = useState<UnifiedInquiry[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<UnifiedInquiry | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await unifiedInquiryApi.getAll(1, 200);
      const data = res.data;
      setAllInquiries(data.data);
    } catch (error) {
      console.error('통합 문의 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // 필터링
  useEffect(() => {
    let filtered = allInquiries;
    if (filter !== 'ALL') {
      filtered = allInquiries.filter((inq) => inq.type === filter);
    }
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / 20));
    const start = (page - 1) * 20;
    setInquiries(filtered.slice(start, start + 20));
  }, [allInquiries, filter, page]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleStatusChange = async (type: string, id: number, status: string) => {
    try {
      await unifiedInquiryApi.updateStatus(type, id, status);
      fetchInquiries();
      // 사이드바 배지 숫자 즉시 갱신
      window.dispatchEvent(new Event('badges-refresh'));
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('이 문의를 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    try {
      await unifiedInquiryApi.delete(type, id);
      fetchInquiries();
      window.dispatchEvent(new Event('badges-refresh'));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCopyLink = async (inq: UnifiedInquiry) => {
    try {
      await navigator.clipboard.writeText(inq.shareUrl);
      setCopiedLink(`${inq.type}-${inq.id}`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleCopyShareMessage = async (inq: UnifiedInquiry) => {
    try {
      const res = await unifiedInquiryApi.getShareMessage(inq.type, inq.id);
      const message = res.data.message;
      if (message) {
        await navigator.clipboard.writeText(message);
        setCopiedMsg(`${inq.type}-${inq.id}`);
        setTimeout(() => setCopiedMsg(null), 2000);
      }
    } catch (error) {
      console.error('공유 메시지 복사 실패:', error);
      alert('공유 메시지 복사에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const exact = `${year}-${month}-${day} ${h}:${m}`;

    // 7일 이내: 상대시간 + 정확한 날짜 둘 다 표시
    if (hours < 1) return `방금 전 · ${exact}`;
    if (days < 1) return `${hours}시간 전 · ${exact}`;
    if (days < 7) return `${days}일 전 · ${exact}`;

    return exact;
  };

  const getTypeCount = (type?: FilterType) => {
    if (!type || type === 'ALL') return allInquiries.length;
    return allInquiries.filter((inq) => inq.type === type).length;
  };

  const getKey = (inq: UnifiedInquiry) => `${inq.type}-${inq.id}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
          <span className="text-sm text-gray-500">총 {total}건</span>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'ALL' as FilterType, label: '전체', icon: MessageSquare },
            { key: 'SERVICE' as FilterType, label: '서비스', icon: Wrench },
            { key: 'GENERAL' as FilterType, label: '일반', icon: MessageSquare },
            { key: 'QUOTE' as FilterType, label: '견적', icon: FileText },
            { key: 'TIRE' as FilterType, label: '🛞 타이어', icon: Wrench },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[#7C4DFF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {getTypeCount(tab.key)}
              </span>
            </button>
          ))}
        </div>

        {/* 카드 리스트 */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
              문의가 없습니다.
            </div>
          ) : (
            inquiries.map((inq) => {
              const typeInfo = TYPE_LABELS[inq.type] || TYPE_LABELS.GENERAL;
              const serviceInfo = inq.serviceType ? SERVICE_TYPE_MAP[inq.serviceType] : null;
              const key = getKey(inq);

              return (
                <div
                  key={key}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* 상단: 타입 뱃지 + 지역 + 서비스 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {inq.regionSido && (
                        <span className="text-sm text-gray-700">
                          📍 {inq.regionSido} {inq.regionSigungu}
                        </span>
                      )}
                      {serviceInfo && (
                        <span className="text-sm text-gray-700">
                          · {serviceInfo.emoji} {serviceInfo.label}
                        </span>
                      )}
                      {inq.carModel && (
                        <span className="text-sm text-gray-700">
                          · 🚗 {inq.carModel}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(inq.createdAt)}
                    </span>
                  </div>

                  {/* 중간: 이름 + 전화번호 + 유입경로 + 설명 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-3 mb-1">
                      {inq.name && (
                        <button
                          onClick={() => setSelectedInquiry(inq)}
                          className="font-semibold text-[#7C4DFF] hover:underline cursor-pointer"
                        >
                          {inq.name}
                        </button>
                      )}
                      {inq.phone && (
                        <a
                          href={`tel:${inq.phone}`}
                          className="text-[#7C4DFF] hover:underline text-sm font-medium"
                        >
                          📞 {inq.phone}
                        </a>
                      )}
                      {inq.trackingLinkName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <Link2 size={12} />
                          {inq.trackingLinkName}
                        </span>
                      )}
                    </div>
                    {inq.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {inq.description}
                      </p>
                    )}
                    {inq.description && inq.description.length >= 100 && (
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="mt-1 flex items-center gap-1 text-xs text-[#7C4DFF] hover:underline"
                      >
                        <Eye size={12} />
                        자세히 보기
                      </button>
                    )}
                    {inq.mechanicName && (
                      <p className="text-xs text-gray-500 mt-1">
                        요청 정비소: {inq.mechanicName}
                      </p>
                    )}
                  </div>

                  {/* 하단: 액션 버튼들 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 공유 링크 복사 */}
                    <button
                      onClick={() => handleCopyLink(inq)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#7C4DFF] hover:bg-[#F5F3FF] rounded-lg transition-colors"
                    >
                      {copiedLink === key ? (
                        <><Check size={14} /> 복사됨</>
                      ) : (
                        <><Copy size={14} /> 링크 복사</>
                      )}
                    </button>

                    {/* 공유 메시지 복사 */}
                    <button
                      onClick={() => handleCopyShareMessage(inq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        copiedMsg === key
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[#FEE500] text-gray-800 hover:bg-[#FDD835]'
                      }`}
                    >
                      {copiedMsg === key ? '✓ 복사됨' : '📋 공유 메시지'}
                    </button>

                    {/* 전화하기 */}
                    {inq.phone && (
                      <a
                        href={`tel:${inq.phone}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Phone size={14} />
                        전화
                      </a>
                    )}

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(inq.type, inq.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>

                    {/* 상태 셀렉트 */}
                    <select
                      value={inq.status}
                      onChange={(e) => handleStatusChange(inq.type, inq.id, e.target.value)}
                      className={`ml-auto px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer ${
                        STATUS_COLORS[inq.status] || 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 문의 상세 보기 모달 */}
      {selectedInquiry && (() => {
        const inq = selectedInquiry;
        const typeInfo = TYPE_LABELS[inq.type] || TYPE_LABELS.GENERAL;
        const serviceInfo = inq.serviceType ? SERVICE_TYPE_MAP[inq.serviceType] : null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedInquiry(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  {serviceInfo && (
                    <span className="text-sm text-gray-600">
                      {serviceInfo.emoji} {serviceInfo.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 모달 본문 */}
              <div className="px-6 py-5 space-y-4">
                {/* 고객 정보 */}
                <div className="space-y-2">
                  {inq.name && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">👤</span>
                      <span className="font-semibold text-gray-900">{inq.name}</span>
                    </div>
                  )}
                  {inq.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">📞</span>
                      <a
                        href={`tel:${inq.phone}`}
                        className="text-[#7C4DFF] hover:underline font-medium"
                      >
                        {inq.phone}
                      </a>
                    </div>
                  )}
                  {(inq.regionSido || inq.regionSigungu) && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">📍</span>
                      <span className="text-gray-700">
                        {inq.regionSido} {inq.regionSigungu}
                        {serviceInfo ? ` · ${serviceInfo.emoji} ${serviceInfo.label}` : ''}
                      </span>
                    </div>
                  )}
                  {inq.carModel && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">🚗</span>
                      <span className="text-gray-700">{inq.carModel}</span>
                    </div>
                  )}
                  {inq.mechanicName && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">🔧</span>
                      <span className="text-gray-700">요청 정비소: {inq.mechanicName}</span>
                    </div>
                  )}
                  {inq.trackingLinkName && (
                    <div className="flex items-center gap-3">
                      <span className="text-base">🔗</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Link2 size={12} />
                        {inq.trackingLinkName}
                      </span>
                    </div>
                  )}
                </div>

                {/* 문의 내용 구분선 */}
                {inq.description && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      문의 내용
                    </p>
                    <p
                      className="text-sm text-gray-700 whitespace-pre-wrap"
                      style={{ lineHeight: '1.7' }}
                    >
                      {inq.description}
                    </p>
                  </div>
                )}

                {/* 접수일시 */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400">
                    접수일시 · {new Date(inq.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (confirm('이 문의를 삭제하시겠습니까?')) {
                      handleDelete(selectedInquiry.type, selectedInquiry.id);
                      setSelectedInquiry(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  <Trash2 size={15} />
                  삭제
                </button>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AdminLayout>
  );
}
