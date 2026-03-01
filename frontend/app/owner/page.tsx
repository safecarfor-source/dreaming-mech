'use client';

import { useEffect, useState } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerMechanicsApi, ownerAuthApi, ownerInquiriesApi } from '@/lib/api';
import { Mechanic, Owner } from '@/types';
import Link from 'next/link';
import { Plus, Store, Eye, X, ChevronRight, Clock, MapPin, Wrench, Car, Phone, User, Link2, MessageSquare } from 'lucide-react';

type OwnerInquiry = {
  id: number;
  name: string | null;
  phone: string | null;
  regionSido: string;
  regionSigungu: string;
  serviceType: string;
  description: string | null;
  vehicleNumber: string | null;
  vehicleModel: string | null;
  status: string;
  sharedAt: string | null;
  shareClickCount: number;
  trackingCode: string | null;
  trackingLink: { id: number; code: string; name: string; description: string | null } | null;
  mechanic: { id: number; name: string; address: string } | null;
  createdAt: string;
};

export default function OwnerDashboardPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<OwnerInquiry | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mechanicsRes, profileRes, inquiriesRes] = await Promise.all([
          ownerMechanicsApi.getAll(),
          ownerAuthApi.getProfile(),
          ownerInquiriesApi.getAll(),
        ]);
        setMechanics(mechanicsRes.data);
        setOwner(profileRes.data);
        setPhone(profileRes.data.phone || '');
        setInquiries(inquiriesRes.data || []);
        setLoadingInquiries(false);
      } catch {
        // 에러 무시 (OwnerLayout에서 인증 처리)
      } finally {
        setLoading(false);
        setLoadingInquiries(false);
      }
    };
    fetchData();
  }, []);

  // 전화번호 포맷팅 (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length !== 11) {
      alert('올바른 전화번호를 입력해주세요. (11자리)');
      return;
    }

    setIsSaving(true);
    try {
      await ownerAuthApi.updateProfile({ phone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      alert(error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const h12 = hours % 12 || 12;
    return `${year}년 ${month}월 ${day}일 ${ampm} ${h12}시 ${minutes}분`;
  };

  const getShareLinkUrl = (inquiryId: number) =>
    `https://dreammechaniclab.com/inquiry/service/${inquiryId}`;

  // 만료 여부: 연결됨/완료 상태에서만 만료 (24시간 제한 없음)
  const isShareLinkExpired = (status: string) => {
    return ['CONNECTED', 'COMPLETED'].includes(status);
  };

  const getServiceTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      TIRE: '🛞 타이어',
      OIL: '🛢️ 엔진오일',
      BRAKE: '🔴 브레이크',
      MAINTENANCE: '🔧 경정비',
      CONSULT: '💬 종합상담',
    };
    return map[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: { label: '접수됨', color: 'bg-yellow-100 text-yellow-700' },
      SHARED: { label: '공유됨', color: 'bg-blue-100 text-blue-700' },
      CONNECTED: { label: '연결됨', color: 'bg-green-100 text-green-700' },
      COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-600' },
    };
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <OwnerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">내 매장을 관리하세요</p>
      </div>

      {/* 알림톡 수신 설정 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📱</span>
          <h2 className="text-lg font-bold text-gray-900">알림톡 수신 설정</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            새 문의 알림
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          전화번호를 등록하면 내 지역에 새 고객 문의가 들어올 때 카카오 알림톡으로 알려드려요.
        </p>

        {/* 전화번호 입력 폼 */}
        <div className="flex gap-3">
          <input
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            maxLength={13}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-200 focus:border-[#7C4DFF] outline-none transition-all"
          />
          <button
            onClick={handleSavePhone}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#7C4DFF] text-white hover:bg-[#6B3FE0]'
            }`}
          >
            {isSaving ? '저장 중...' : saveSuccess ? '✓ 저장됨' : '저장'}
          </button>
        </div>
        {saveSuccess && (
          <p className="text-sm text-green-600 mt-2">
            ✓ 전화번호가 성공적으로 저장되었습니다.
          </p>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Store size={20} className="text-[#7C4DFF]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">등록된 매장</p>
              <p className="text-2xl font-bold">{mechanics.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <MessageSquare size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">고객 문의</p>
              <p className="text-2xl font-bold">{inquiries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 고객 문의 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold text-gray-900">고객 문의</h2>
            {inquiries.length > 0 && (
              <span className="bg-[#7C4DFF] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {inquiries.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">내 정비소를 선택한 고객 문의만 표시됩니다</p>
        </div>

        {loadingInquiries ? (
          <div className="text-center text-gray-500 py-10">불러오는 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">아직 접수된 문의가 없습니다.</p>
            <p className="text-gray-500 text-xs mt-1">고객이 문의 시 내 정비소를 선택하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {inquiries.map((inq) => {
              const badge = getStatusLabel(inq.status);
              const shareInfo = inq.sharedAt
                ? {
                    url: getShareLinkUrl(inq.id),
                    sharedAt: formatDateTime(inq.sharedAt),
                    isExpired: isShareLinkExpired(inq.status),
                    clickCount: inq.shareClickCount || 0,
                  }
                : null;
              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className="w-full text-left px-6 py-4 hover:bg-[#F5F3FF] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 첫 줄: 서비스 타입 + 상태 뱃지 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{getServiceTypeLabel(inq.serviceType)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                        {shareInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${shareInfo.isExpired ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                            🔗 링크 {shareInfo.isExpired ? '만료' : '활성'}
                          </span>
                        )}
                      </div>
                      {/* 둘째 줄: 지역 + 차량 정보 */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>📍 {inq.regionSido} {inq.regionSigungu}</span>
                        {(inq.vehicleModel || inq.vehicleNumber) && (
                          <span>🚗 {[inq.vehicleModel, inq.vehicleNumber].filter(Boolean).join(' / ')}</span>
                        )}
                        {inq.name && <span>👤 {inq.name}</span>}
                      </div>
                      {/* 셋째 줄: 추가 설명 미리보기 */}
                      {inq.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">💬 {inq.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        {formatDateTime(inq.createdAt)}
                      </p>
                      {shareInfo && (
                        <p className="text-xs text-gray-500 mt-0.5">클릭 {shareInfo.clickCount}회</p>
                      )}
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-[#7C4DFF] ml-auto mt-1 transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 문의 상세 모달 */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="text-lg font-bold text-gray-900">문의 상세</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusLabel(selectedInquiry.status).color}`}>
                  {getStatusLabel(selectedInquiry.status).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 문의 기본 정보 */}
              <div className="bg-[#F5F3FF] rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-[#7C4DFF] uppercase tracking-wide">문의 내용</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-semibold">{getServiceTypeLabel(selectedInquiry.serviceType)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{selectedInquiry.regionSido} {selectedInquiry.regionSigungu}</span>
                  </div>
                  {selectedInquiry.name && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{selectedInquiry.name}</span>
                    </div>
                  )}
                  {selectedInquiry.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-[#7C4DFF]">{selectedInquiry.phone}</span>
                    </div>
                  )}
                  {(selectedInquiry.vehicleNumber || selectedInquiry.vehicleModel) && (
                    <div className="flex items-center gap-2">
                      <Car size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{[selectedInquiry.vehicleModel, selectedInquiry.vehicleNumber].filter(Boolean).join(' / ')}</span>
                    </div>
                  )}
                  {selectedInquiry.description && (
                    <div className="flex items-start gap-2 pt-1 border-t border-purple-100">
                      <span className="text-gray-400 flex-shrink-0 text-xs mt-0.5">💬</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedInquiry.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 접수 시간 */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                <Clock size={14} className="text-gray-400" />
                <span>접수 시간</span>
                <span className="font-semibold ml-auto text-gray-900">{formatDateTime(selectedInquiry.createdAt)}</span>
              </div>

              {/* 선택된 정비소 */}
              {selectedInquiry.mechanic && (
                <div className="bg-purple-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-[#7C4DFF] mb-1">선택된 정비소</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedInquiry.mechanic.name}</p>
                  {selectedInquiry.mechanic.address && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedInquiry.mechanic.address}</p>
                  )}
                </div>
              )}

              {/* 공유 링크 정보 */}
              {selectedInquiry.sharedAt ? (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Link2 size={13} />
                    공유 링크 정보
                  </h4>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-600 truncate">{getShareLinkUrl(selectedInquiry.id)}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(getShareLinkUrl(selectedInquiry.id)); }}
                      className="text-xs text-[#7C4DFF] font-semibold hover:underline flex-shrink-0"
                    >
                      복사
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-gray-400 mb-0.5">공유 시작</p>
                      <p className="font-semibold text-gray-800">{formatDateTime(selectedInquiry.sharedAt)}</p>
                    </div>
                    <div className={`rounded-lg px-3 py-2 ${isShareLinkExpired(selectedInquiry.status) ? 'bg-red-50' : 'bg-green-50'}`}>
                      <p className={`mb-0.5 ${isShareLinkExpired(selectedInquiry.status) ? 'text-red-400' : 'text-green-500'}`}>링크 상태</p>
                      <p className={`font-semibold text-xs ${isShareLinkExpired(selectedInquiry.status) ? 'text-red-600' : 'text-green-700'}`}>
                        {isShareLinkExpired(selectedInquiry.status) ? '⚠️ 만료됨 (연결 완료)' : '✅ 활성'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-blue-600">🔗 링크 클릭 수</span>
                    <span className="font-bold text-blue-700 text-sm">{selectedInquiry.shareClickCount}회</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-gray-400 bg-gray-50 rounded-xl">
                  아직 공유 링크가 생성되지 않았습니다
                </div>
              )}

              {/* 유입 경로 (추적 링크) */}
              {selectedInquiry.trackingLink && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                    📌 유입 경로 (추적 링크)
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">{selectedInquiry.trackingLink.name}</p>
                  {selectedInquiry.trackingLink.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedInquiry.trackingLink.description}</p>
                  )}
                  <p className="text-xs text-amber-600 mt-1">코드: {selectedInquiry.trackingLink.code}</p>
                </div>
              )}

              {/* 문의 ID */}
              <p className="text-xs text-gray-400 text-center">문의 번호 #{selectedInquiry.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* 매장 목록 */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">로딩 중...</div>
      ) : mechanics.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Store size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">아직 등록된 매장이 없습니다.</p>
          <Link
            href="/owner/mechanics/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6B3FE0] transition-colors"
          >
            <Plus size={18} />
            첫 매장 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mechanics.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.address}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    조회수: {m.clickCount}
                  </p>
                </div>
                <Link
                  href={`/owner/mechanics/${m.id}/edit`}
                  className="text-sm text-[#7C4DFF] hover:text-[#6B3FE0] transition-colors"
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
