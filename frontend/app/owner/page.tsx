'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerMechanicsApi, userAuthApi, ownerInquiriesApi, ownerRegionInquiriesApi } from '@/lib/api';
import { Mechanic, User as UserType } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Store, Eye, X, ChevronRight, Clock, MapPin, Wrench, Car, Phone, User, Link2, MessageSquare, FileText, ArrowRight, BarChart2, CheckCircle2, Bell } from 'lucide-react';

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

type NewInquiryToast = {
  id: number;
  regionSido: string;
  regionSigungu: string;
  serviceType: string;
  createdAt: string;
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<UserType | null>(null);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<OwnerInquiry | null>(null);
  const [newInquiryToasts, setNewInquiryToasts] = useState<NewInquiryToast[]>([]);
  const lastPolledAtRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 프로필은 반드시 필요
        const profileRes = await userAuthApi.getProfile();
        setOwner(profileRes.data);
        setPhone(profileRes.data.phone || '');

        // 매장 + 문의는 APPROVED만 가능 → 개별 catch로 처리 (PENDING 403 방지)
        try {
          const mechanicsRes = await ownerMechanicsApi.getAll();
          setMechanics(mechanicsRes.data);
        } catch {
          // PENDING/REJECTED 상태면 403 → 무시
        }

        try {
          const inquiriesRes = await ownerInquiriesApi.getAll();
          setInquiries(inquiriesRes.data || []);
        } catch {
          // 무시
        }
      } catch {
        // 프로필 조회 실패 → OwnerLayout에서 인증 처리
      } finally {
        setLoading(false);
        setLoadingInquiries(false);
      }
    };
    fetchData();
  }, []);

  // 새 문의 폴링 (30초마다)
  const pollNewInquiries = useCallback(async () => {
    try {
      const since = lastPolledAtRef.current;
      const res = await ownerRegionInquiriesApi.getAll(since ?? undefined);
      const items = res.data ?? [];

      if (items.length > 0) {
        // 최신 createdAt을 lastPolledAt으로 저장
        const latest = items.reduce((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b
        );
        lastPolledAtRef.current = latest.createdAt;

        // 최초 폴링(since가 null)이면 토스트 없이 기준점만 설정
        if (since !== null) {
          const newOnes = items.map((inq) => ({
            id: inq.id,
            regionSido: inq.regionSido,
            regionSigungu: inq.regionSigungu,
            serviceType: inq.serviceType,
            createdAt: inq.createdAt,
          }));
          setNewInquiryToasts((prev) => [...newOnes, ...prev].slice(0, 5));
          // 5초 후 자동 제거
          setTimeout(() => {
            setNewInquiryToasts((prev) => prev.filter((t) => !newOnes.some((n) => n.id === t.id)));
          }, 5000);
        }
      } else if (since === null) {
        // 문의 없어도 기준점을 현재 시간으로 설정
        lastPolledAtRef.current = new Date().toISOString();
      }
    } catch {
      // 폴링 실패 시 무시
    }
  }, []);

  useEffect(() => {
    // 초기 폴링 실행
    pollNewInquiries();
    pollingIntervalRef.current = setInterval(pollNewInquiries, 30_000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [pollNewInquiries]);

  const dismissToast = (id: number) => {
    setNewInquiryToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      await userAuthApi.updateProfile({ phone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      alert(error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 프로필 완성도 계산
  const profileItems = [
    {
      key: 'phone',
      label: '전화번호 등록',
      done: !!(owner?.phone && owner.phone.replace(/[^\d]/g, '').length === 11),
    },
    {
      key: 'business',
      label: '사업자 정보 제출',
      done: !!(owner?.businessLicenseUrl),
    },
    {
      key: 'mechanic',
      label: '정비소 등록',
      done: mechanics.length > 0,
    },
  ];
  const completedCount = profileItems.filter((i) => i.done).length;
  const completionPercent = Math.round((completedCount / profileItems.length) * 100);

  // 프로필 완성도 카드 클릭 시 첫 번째 미완성 항목으로 이동
  const handleProfileCardClick = () => {
    const firstIncomplete = profileItems.find((i) => !i.done);
    if (!firstIncomplete) return;
    if (firstIncomplete.key === 'phone') {
      phoneInputRef.current?.focus();
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (firstIncomplete.key === 'business') {
      router.push('/owner/onboarding');
    } else if (firstIncomplete.key === 'mechanic') {
      router.push('/owner/mechanics/new');
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
      {/* 새 문의 토스트 알림 */}
      {newInquiryToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[calc(100vw-2rem)]">
          {newInquiryToasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-white border border-[#7C4DFF]/30 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 animate-in slide-in-from-right duration-300"
            >
              <div className="w-8 h-8 bg-[#7C4DFF]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={16} className="text-[#7C4DFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">새 고객 문의가 들어왔습니다</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {toast.regionSido} {toast.regionSigungu} · {getServiceTypeLabel(toast.serviceType)}
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 px-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-keep">대시보드</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base break-keep">내 매장을 관리하세요</p>
      </div>

      {/* 매장 등록 CTA — 매장 없을 때 최상단에 노출 */}
      {!loading && mechanics.length === 0 && (
        <Link
          href="/owner/mechanics/new"
          className="mb-6 flex items-center gap-4 bg-gradient-to-r from-[#7C4DFF] to-[#9C6FFF] text-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">매장 등록하기</p>
            <p className="text-white/70 text-sm mt-0.5">내 정비소 정보를 입력하고 고객을 만나세요</p>
          </div>
          <ChevronRight size={20} className="text-white/50 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* 프로필 완성도 카드 */}
      {!loading && (
        <button
          onClick={handleProfileCardClick}
          className="w-full mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7C4DFF]/30 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">프로필 완성도</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  completionPercent === 100
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#7C4DFF]/10 text-[#7C4DFF]'
                }`}
              >
                {completionPercent}%
              </span>
            </div>
            {completionPercent < 100 && (
              <span className="text-xs text-[#7C4DFF] font-semibold flex items-center gap-0.5 group-hover:underline">
                완성하기
                <ChevronRight size={14} />
              </span>
            )}
          </div>

          {/* 게이지 바 */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                completionPercent === 100 ? 'bg-green-500' : 'bg-[#7C4DFF]'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* 항목 목록 */}
          <div className="flex flex-wrap gap-3">
            {profileItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                  item.done
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                <CheckCircle2 size={13} className={item.done ? 'text-green-500' : 'text-gray-300'} />
                {item.label}
              </div>
            ))}
          </div>
        </button>
      )}

      {/* 사업자 미제출: 제출 유도 배너 */}
      {owner?.businessStatus === 'PENDING' && !owner?.businessLicenseUrl && (
        <div className="mb-6 bg-gradient-to-r from-[#F5F3FF] to-white border-2 border-[#7C4DFF]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#7C4DFF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-[#7C4DFF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">사업자 등록증을 제출하면 정비소를 공개할 수 있습니다</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                사업자등록증, 상호, 전화번호를 제출하고 승인받으면 정비소가 메인 페이지에 노출됩니다.<br />
                <span className="text-amber-600 font-medium">팩트 체크를 위한 정보이며, 외부에 공개되지 않습니다.</span>
              </p>
              <Link
                href="/owner/onboarding"
                className="inline-flex items-center gap-2 bg-[#7C4DFF] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B3FE0] transition-colors"
              >
                사업자 등록증 제출하기
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 제출 완료 + 승인 대기 중 */}
      {owner?.businessStatus === 'PENDING' && owner?.businessLicenseUrl && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">관리자 검토 중입니다</h3>
            <p className="text-sm text-amber-600">사업자 정보가 접수되었습니다. 승인 후 정비소를 공개할 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* 알림톡 수신 설정 */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xl">📱</span>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">알림톡 수신 설정</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            새 문의 알림
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          전화번호를 등록하면 내 지역에 새 고객 문의가 들어올 때 카카오 알림톡으로 알려드려요.
        </p>

        {/* 전화번호 입력 폼 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            ref={phoneInputRef}
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            maxLength={13}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-200 focus:border-[#7C4DFF] outline-none transition-all text-sm"
          />
          <button
            onClick={handleSavePhone}
            disabled={isSaving}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
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

      {/* 리포트 바로가기 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BarChart2 size={20} className="text-[#7C4DFF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">월간 리포트</h3>
              <p className="text-xs text-gray-500">조회수, 전화확인, 지역순위를 확인하세요</p>
            </div>
          </div>
          <Link href="/owner/report" className="text-sm font-medium text-[#7C4DFF] hover:underline">
            자세히 보기 →
          </Link>
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
