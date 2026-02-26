'use client';

import { useEffect, useState, useCallback, FormEvent, MouseEvent } from 'react';
import {
  Link2,
  Plus,
  Copy,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { trackingLinkApi } from '@/lib/api';
import type { TrackingLink, TrackingLinkDetail } from '@/types';

const SERVICE_TYPE_MAP: Record<string, string> = {
  TIRE: '타이어',
  OIL: '엔진오일',
  BRAKE: '브레이크',
  MAINTENANCE: '경정비',
  CONSULT: '종합상담',
};

const SITE_DOMAIN = 'dreammechaniclab.com';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDatetime(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}

export default function AdminTrackingPage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 생성 폼 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [newLinkCode, setNewLinkCode] = useState<string | null>(null);

  // 복사 상태 (key: `url-{id}` 또는 `new`)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 상세 모달 상태
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TrackingLinkDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 링크 목록 조회
  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trackingLinkApi.getAll();
      const data = res.data;
      // API가 { data: TrackingLink[] } 또는 TrackingLink[] 형태로 올 수 있음
      const list: TrackingLink[] = Array.isArray(data) ? data : (data as { data: TrackingLink[] }).data ?? [];
      setLinks(list);
    } catch (err) {
      console.error('추적 링크 목록 로딩 실패:', err);
      setError('추적 링크 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // 클립보드 복사 유틸
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // 링크 생성
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await trackingLinkApi.create({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });
      const created: TrackingLink = res.data?.data ?? res.data;
      setNewLinkCode(created.code);
      setCreateName('');
      setCreateDescription('');
      await fetchLinks();
    } catch {
      alert('링크 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  // 활성/비활성 토글
  const handleToggleActive = async (link: TrackingLink, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await trackingLinkApi.update(link.id, { isActive: !link.isActive });
      setLinks((prev: TrackingLink[]) =>
        prev.map((l: TrackingLink) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l))
      );
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 추적 링크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await trackingLinkApi.delete(id);
      setLinks((prev: TrackingLink[]) => prev.filter((l: TrackingLink) => l.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch {
      alert('링크 삭제에 실패했습니다.');
    }
  };

  // 상세 조회
  const handleRowClick = async (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await trackingLinkApi.getOne(id);
      const data: TrackingLinkDetail = res.data?.data ?? res.data;
      setDetail(data);
    } catch {
      alert('상세 정보를 불러오는데 실패했습니다.');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
  };

  // 막대 차트 최대값 계산
  const getChartMaxClicks = (dailyClicks: TrackingLinkDetail['dailyClicks']): number => {
    if (!dailyClicks?.length) return 1;
    return Math.max(...dailyClicks.map((d) => d.clicks), 1);
  };

  const shareUrl = (code: string) => `${SITE_DOMAIN}?ref=${code}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">추적 링크 관리</h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              단톡방/카페 공유 링크의 클릭수와 전환율을 확인하세요
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm((v) => !v);
              setNewLinkCode(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7C4DFF] text-white text-sm font-semibold rounded-xl hover:bg-[#6B3FE0] transition-colors self-start sm:self-auto"
          >
            <Plus size={18} />
            새 링크 만들기
          </button>
        </div>

        {/* 생성 폼 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">새 추적 링크 만들기</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="예: 강남맘카페"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  설명 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="어디에 공유할 링크인지 메모"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createLoading || !createName.trim()}
                  className="px-5 py-2.5 bg-[#7C4DFF] text-white text-sm font-semibold rounded-xl hover:bg-[#6B3FE0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createLoading ? '생성 중...' : '링크 생성'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewLinkCode(null);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  취소
                </button>
              </div>
            </form>

            {/* 생성 완료 — 링크 표시 */}
            {newLinkCode && (
              <div className="mt-5 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                  링크가 생성되었습니다
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-sm text-purple-900 font-mono bg-white border border-purple-200 rounded-lg px-3 py-2 truncate">
                    {shareUrl(newLinkCode)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(shareUrl(newLinkCode!), 'new')}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedKey === 'new' ? (
                      <>
                        <Check size={15} />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 목록 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-pulse space-y-3 max-w-sm mx-auto">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center">
              <Link2 size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">아직 추적 링크가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">첫 링크를 만들어보세요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      이름
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      공유 URL
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      클릭수
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      가입자
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      문의
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      전환율
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      상태
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      생성일
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {links.map((link: TrackingLink) => {
                    const url = shareUrl(link.code);
                    const isSelected = selectedId === link.id;
                    const convRate =
                      link.conversionRate !== undefined
                        ? link.conversionRate
                        : link.totalClicks
                        ? (((link.totalInquiries ?? 0) / link.totalClicks) * 100)
                        : 0;

                    return (
                      <tr
                        key={link.id}
                        onClick={() => handleRowClick(link.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* 이름 + 설명 */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{link.name}</p>
                          {link.description && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                              {link.description}
                            </p>
                          )}
                        </td>

                        {/* 공유 URL */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 max-w-[220px]">
                            <span className="text-xs text-gray-600 font-mono truncate">
                              {url}
                            </span>
                            <button
                              onClick={() => copyToClipboard(url, `url-${link.id}`)}
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#7C4DFF] hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              {copiedKey === `url-${link.id}` ? (
                                <>
                                  <Check size={13} />
                                  복사됨
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  복사
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 클릭수 */}
                        <td className="px-5 py-4 text-center">
                          <p className="text-sm font-semibold text-gray-900">
                            {(link.totalClicks ?? 0).toLocaleString()}
                          </p>
                          {(link.uniqueClicks !== undefined && link.uniqueClicks !== link.totalClicks) && (
                            <p className="text-xs text-gray-400">
                              유니크 {link.uniqueClicks.toLocaleString()}
                            </p>
                          )}
                        </td>

                        {/* 가입자수 */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold bg-amber-50 text-amber-700">
                            {(link.totalSignups ?? 0).toLocaleString()}
                          </span>
                        </td>

                        {/* 문의 전환수 */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {(link.totalInquiries ?? 0).toLocaleString()}
                          </span>
                        </td>

                        {/* 전환율 */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`text-sm font-semibold ${
                              convRate >= 10
                                ? 'text-green-600'
                                : convRate >= 5
                                ? 'text-blue-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {convRate.toFixed(1)}%
                          </span>
                        </td>

                        {/* 활성 토글 */}
                        <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleActive(link, e)}
                            className="flex items-center justify-center gap-1.5 mx-auto"
                          >
                            {link.isActive ? (
                              <>
                                <ToggleRight size={22} className="text-[#7C4DFF]" />
                                <span className="text-xs text-[#7C4DFF] font-medium">활성</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={22} className="text-gray-400" />
                                <span className="text-xs text-gray-400 font-medium">비활성</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* 생성일 */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">{formatDate(link.createdAt)}</span>
                        </td>

                        {/* 액션 */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDelete(link.id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={15} />
                            </button>
                            <button
                              onClick={() => handleRowClick(link.id)}
                              className="p-1.5 text-gray-400 hover:text-[#7C4DFF] hover:bg-purple-50 rounded-lg transition-colors"
                              title="상세 보기"
                            >
                              {isSelected ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {(selectedId !== null) && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* 모달 본체 */}
          <div className="relative bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-xs text-gray-400">추적 링크</p>
                <h2 className="text-lg font-bold text-gray-900">
                  {detail ? detail.name : '로딩 중...'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            {detailLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-32 bg-gray-200 rounded" />
                </div>
              </div>
            ) : detail ? (
              <div className="px-6 py-5 space-y-6">
                {/* 핵심 지표 카드 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <MousePointerClick size={18} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">
                      {(detail.totalClicks ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">총 클릭</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <Users size={18} className="text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">
                      {(detail.totalSignups ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">가입자수</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <MessageSquare size={18} className="text-[#7C4DFF] mx-auto mb-1" />
                    <p className="text-2xl font-bold text-[#7C4DFF]">
                      {(detail.totalInquiries ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">문의 전환</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <TrendingUp size={18} className="text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">
                      {detail.totalClicks
                        ? (((detail.totalInquiries ?? 0) / detail.totalClicks) * 100).toFixed(1)
                        : '0.0'}%
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">전환율</p>
                  </div>
                </div>

                {/* 일별 클릭 추이 — CSS 막대 차트 */}
                {detail.dailyClicks?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      일별 클릭 추이
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-end gap-1 h-24">
                        {detail.dailyClicks.slice(-14).map((day: { date: string; clicks: number }) => {
                          const max = getChartMaxClicks(detail.dailyClicks.slice(-14));
                          const pct = max > 0 ? (day.clicks / max) * 100 : 0;
                          return (
                            <div
                              key={day.date}
                              className="flex-1 flex flex-col items-center gap-1 group"
                            >
                              <div className="relative w-full flex items-end h-20">
                                <div
                                  className="w-full bg-[#7C4DFF] rounded-t opacity-70 group-hover:opacity-100 transition-opacity"
                                  style={{ height: `${Math.max(pct, 4)}%` }}
                                  title={`${day.date}: ${day.clicks}회`}
                                />
                              </div>
                              <span className="text-[9px] text-gray-400 hidden sm:block">
                                {day.date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 가입 고객 목록 */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    해당 링크로 가입한 고객{' '}
                    <span className="text-amber-600 font-bold">
                      ({detail.customers?.length ?? 0}명)
                    </span>
                  </p>
                  {detail.customers?.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">닉네임</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">전화번호</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">가입일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detail.customers.map((c: { id: number; nickname?: string; phone?: string; createdAt: string }) => (
                            <tr key={c.id} className="hover:bg-amber-50 transition-colors">
                              <td className="px-4 py-2.5 text-sm text-gray-900">
                                {c.nickname || <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-4 py-2.5 text-sm">
                                {c.phone ? (
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="text-[#7C4DFF] hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {c.phone}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {formatDatetime(c.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
                      아직 가입한 고객이 없습니다.
                    </p>
                  )}
                </div>

                {/* 문의 목록 */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    해당 링크로 접수된 문의{' '}
                    <span className="text-[#7C4DFF] font-bold">
                      ({detail.inquiries?.length ?? 0}건)
                    </span>
                  </p>
                  {detail.inquiries?.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">서비스</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">지역</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">전화번호</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">접수일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detail.inquiries.map((inq: { id: number; serviceType: string; regionSido: string; regionSigungu: string; phone?: string; createdAt: string }) => (
                            <tr key={inq.id} className="hover:bg-purple-50 transition-colors">
                              <td className="px-4 py-2.5 text-sm text-gray-900">
                                {SERVICE_TYPE_MAP[inq.serviceType] ?? inq.serviceType}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-gray-700">
                                {inq.regionSido} {inq.regionSigungu}
                              </td>
                              <td className="px-4 py-2.5 text-sm">
                                {inq.phone ? (
                                  <a
                                    href={`tel:${inq.phone}`}
                                    className="text-[#7C4DFF] hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {inq.phone}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {formatDatetime(inq.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
                      아직 접수된 문의가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
