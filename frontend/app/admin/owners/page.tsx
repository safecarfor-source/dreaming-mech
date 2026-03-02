'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminOwnerApi } from '@/lib/api';
import { Owner } from '@/types';
import {
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  Eye,
  Building2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Shield,
  RotateCcw,
  UserMinus,
  Search,
  ArrowUpDown,
  Users,
  RefreshCw,
} from 'lucide-react';

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';
type SortOption = 'newest' | 'name' | 'status';

// 배지 갱신 이벤트 dispatch
const refreshBadges = () => {
  window.dispatchEvent(new Event('badges-refresh'));
};

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // 거절 사유 모달 상태
  const [rejectModalOwner, setRejectModalOwner] = useState<Owner | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // 탈퇴 확인 모달 상태
  const [deactivateModalOwner, setDeactivateModalOwner] = useState<Owner | null>(null);
  const [deactivating, setDeactivating] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // 페이지 진입 시 배지 갱신 (해당 페이지 방문 = 확인한 것으로 간주)
  useEffect(() => {
    refreshBadges();
  }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('이 사장님을 승인하시겠습니까?')) return;
    try {
      await adminOwnerApi.approve(id);
      setSelectedOwner(null);
      fetchOwners();
      refreshBadges();
    } catch {
      alert('승인에 실패했습니다.');
    }
  };

  const openRejectModal = (owner: Owner) => {
    setRejectModalOwner(owner);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalOwner) return;
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    setRejecting(true);
    try {
      await adminOwnerApi.reject(rejectModalOwner.id, rejectReason.trim());
      setRejectModalOwner(null);
      setSelectedOwner(null);
      fetchOwners();
      refreshBadges();
    } catch {
      alert('거절에 실패했습니다.');
    } finally {
      setRejecting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateModalOwner) return;
    setDeactivating(true);
    try {
      await adminOwnerApi.deactivate(deactivateModalOwner.id);
      setDeactivateModalOwner(null);
      setSelectedOwner(null);
      fetchOwners();
      refreshBadges();
    } catch (error: any) {
      const message = error?.response?.data?.message || '탈퇴 처리에 실패했습니다.';
      alert(message);
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async (id: number) => {
    if (!confirm('이 사장님을 복원하시겠습니까?')) return;
    try {
      await adminOwnerApi.reactivate(id);
      setSelectedOwner(null);
      fetchOwners();
      refreshBadges();
    } catch {
      alert('복원에 실패했습니다.');
    }
  };

  const handleToggleProtected = async (owner: Owner) => {
    const action = owner.isProtected ? '보호 해제' : '보호 설정';
    if (!confirm(`이 사장님을 ${action}하시겠습니까?`)) return;
    try {
      await adminOwnerApi.toggleProtected(owner.id);
      fetchOwners();
      refreshBadges();
    } catch {
      alert(`${action}에 실패했습니다.`);
    }
  };

  // 검색 + 정렬 적용
  const filteredOwners = useMemo(() => {
    let result = [...owners];

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.businessName?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q)
      );
    }

    // 정렬
    switch (sortOption) {
      case 'newest':
        // 서버에서 이미 updatedAt desc로 정렬되어 옴 — 기본값
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
        break;
      case 'status':
        const statusOrder = { PENDING: 0, APPROVED: 1, REJECTED: 2, DEACTIVATED: 3 };
        result.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
        break;
    }

    return result;
  }, [owners, searchQuery, sortOption]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <Clock size={11} /> 대기중
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <UserCheck size={11} /> 승인됨
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-full">
            <UserX size={11} /> 거절됨
          </span>
        );
      case 'DEACTIVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 rounded-full">
            <UserMinus size={11} /> 탈퇴
          </span>
        );
      default:
        return null;
    }
  };

  const providerLabel = (provider: string) => {
    return provider === 'naver' ? (
      <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md font-semibold border border-green-200">네이버</span>
    ) : (
      <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-md font-semibold border border-yellow-200">카카오</span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${mins}`;
  };

  const timeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    return formatDate(dateStr);
  };

  // 전체 데이터 기준 카운트 (필터와 무관)
  const counts = useMemo(() => {
    // filter가 'all'이 아닌 경우엔 카운트 의미가 다르므로
    // 서버에서 전체 데이터를 받아야 하지만, 현재 구조상 filter별 데이터만 받음
    // UI에서는 현재 로드된 데이터의 카운트 표시
    if (filter === 'all') {
      return {
        all: owners.length,
        PENDING: owners.filter(o => o.status === 'PENDING').length,
        APPROVED: owners.filter(o => o.status === 'APPROVED').length,
        REJECTED: owners.filter(o => o.status === 'REJECTED').length,
        DEACTIVATED: owners.filter(o => o.status === 'DEACTIVATED').length,
      };
    }
    return {
      all: 0,
      PENDING: filter === 'PENDING' ? owners.length : 0,
      APPROVED: filter === 'APPROVED' ? owners.length : 0,
      REJECTED: filter === 'REJECTED' ? owners.length : 0,
      DEACTIVATED: filter === 'DEACTIVATED' ? owners.length : 0,
    };
  }, [owners, filter]);

  const filterTabs = [
    { value: 'all' as FilterStatus, label: '전체', count: counts.all, color: 'bg-gray-600' },
    { value: 'PENDING' as FilterStatus, label: '대기중', count: counts.PENDING, color: 'bg-amber-500' },
    { value: 'APPROVED' as FilterStatus, label: '승인됨', count: counts.APPROVED, color: 'bg-emerald-500' },
    { value: 'REJECTED' as FilterStatus, label: '거절됨', count: counts.REJECTED, color: 'bg-red-500' },
    { value: 'DEACTIVATED' as FilterStatus, label: '탈퇴', count: counts.DEACTIVATED, color: 'bg-gray-400' },
  ];

  return (
    <AdminLayout>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7C4DFF]/10 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-[#7C4DFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">정비사 회원가입 현황</h1>
                <p className="text-sm text-gray-500 mt-0.5">가입 요청 승인/거절 · 정비사 정보 관리</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchOwners(); }}
            className="p-2.5 text-gray-400 hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/5 rounded-xl transition-all"
            title="새로고침"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {filter === 'all' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '대기중', count: counts.PENDING, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock },
            { label: '승인됨', count: counts.APPROVED, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: UserCheck },
            { label: '거절됨', count: counts.REJECTED, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: UserX },
            { label: '탈퇴', count: counts.DEACTIVATED, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', icon: UserMinus },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} border ${stat.border} rounded-xl p-4 transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                <stat.icon size={14} className={stat.color} />
              </div>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* 검색 + 필터 + 정렬 바 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        {/* 검색 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호, 업체명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7C4DFF] focus:bg-white transition-colors text-gray-900 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 필터 탭 + 정렬 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  filter === tab.value
                    ? 'bg-[#7C4DFF] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
                {filter === 'all' && tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    filter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={13} className="text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7C4DFF]"
            >
              <option value="newest">최신순</option>
              <option value="name">이름순</option>
              <option value="status">상태순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 검색 결과 카운트 */}
      {searchQuery && (
        <p className="text-xs text-gray-500 mb-3 px-1">
          검색 결과: <strong className="text-gray-900">{filteredOwners.length}</strong>건
          {filteredOwners.length !== owners.length && (
            <span className="text-gray-400"> (전체 {owners.length}건)</span>
          )}
        </p>
      )}

      {/* 메인 리스트 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={24} className="text-[#7C4DFF] animate-spin" />
          <span className="text-sm text-gray-500">로딩 중...</span>
        </div>
      ) : filteredOwners.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? '검색 결과가 없습니다' : '해당하는 사장님이 없습니다'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-[#7C4DFF] mt-2 hover:underline"
            >
              검색 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                owner.status === 'PENDING'
                  ? 'border-amber-200 ring-1 ring-amber-100'
                  : owner.status === 'DEACTIVATED'
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-100'
              }`}
            >
              {/* PENDING 상태 강조 띠 */}
              {owner.status === 'PENDING' && (
                <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
              )}

              {/* 카드 헤더 */}
              <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                {/* 프로필 + 이름 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {owner.profileImage ? (
                      <img
                        src={owner.profileImage}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C4DFF]/20 to-[#7C4DFF]/5 flex items-center justify-center text-sm font-bold text-[#7C4DFF]">
                        {owner.name?.[0] || '?'}
                      </div>
                    )}
                    {/* 상태 인디케이터 */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      owner.status === 'PENDING' ? 'bg-amber-400' :
                      owner.status === 'APPROVED' ? 'bg-emerald-400' :
                      owner.status === 'REJECTED' ? 'bg-red-400' :
                      'bg-gray-300'
                    }`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-[15px]">
                        {owner.name || '(이름 없음)'}
                      </span>
                      {owner.isProtected && (
                        <Shield size={13} className="text-[#7C4DFF]" fill="#7C4DFF" />
                      )}
                      {providerLabel(owner.provider)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{owner.email || ''}</span>
                      {owner.updatedAt && (
                        <span className="text-[10px] text-gray-400">· {timeAgo(owner.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 상태 배지 + 액션 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(owner.status)}

                  {owner.businessLicenseUrl && (
                    <button
                      onClick={() => setSelectedOwner(owner)}
                      className="p-2 text-[#7C4DFF] hover:bg-[#7C4DFF]/5 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye size={16} />
                    </button>
                  )}

                  {/* PENDING: 승인/거절 */}
                  {owner.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check size={13} /> 승인
                      </button>
                      <button
                        onClick={() => openRejectModal(owner)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X size={13} /> 거절
                      </button>
                    </>
                  )}

                  {/* APPROVED: 탈퇴 */}
                  {owner.status === 'APPROVED' && (
                    <button
                      onClick={() => setDeactivateModalOwner(owner)}
                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserMinus size={13} />
                    </button>
                  )}

                  {/* REJECTED: 재승인 */}
                  {owner.status === 'REJECTED' && (
                    <button
                      onClick={() => handleApprove(owner.id)}
                      className="px-3 py-1.5 text-xs font-medium text-[#7C4DFF] bg-[#7C4DFF]/5 hover:bg-[#7C4DFF]/10 rounded-lg transition-colors"
                    >
                      재승인
                    </button>
                  )}

                  {/* DEACTIVATED: 복원 */}
                  {owner.status === 'DEACTIVATED' && (
                    <button
                      onClick={() => handleReactivate(owner.id)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={13} /> 복원
                    </button>
                  )}
                </div>
              </div>

              {/* 카드 정보 */}
              {(owner.businessName || owner.phone || owner.address) && (
                <div className="border-t border-gray-50 px-4 py-2.5 bg-gray-50/60 flex items-center gap-4 flex-wrap">
                  {owner.businessName && (
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Building2 size={12} className="text-gray-400" />
                      {owner.businessName}
                    </span>
                  )}
                  {owner.phone && (
                    <a href={`tel:${owner.phone}`} className="text-xs text-[#7C4DFF] hover:underline flex items-center gap-1">
                      <Phone size={12} />
                      {owner.phone}
                    </a>
                  )}
                  {owner.address && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      {owner.address}
                    </span>
                  )}
                </div>
              )}

              {/* 거절 사유 / 탈퇴 일시 */}
              {owner.status === 'REJECTED' && owner.rejectionReason && (
                <div className="border-t border-red-100 px-4 py-2 bg-red-50/50">
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} />
                    거절: {owner.rejectionReason}
                  </p>
                </div>
              )}
              {owner.status === 'DEACTIVATED' && owner.deactivatedAt && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar size={11} />
                    탈퇴: {formatDate(owner.deactivatedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 사업자등록증 상세 모달 */}
      {selectedOwner && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOwner(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-xs text-gray-400">사장님 상세 정보</p>
                <h3 className="text-lg font-bold text-gray-900">{selectedOwner.name || '(이름 없음)'}</h3>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* 프로필 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {selectedOwner.profileImage ? (
                  <img src={selectedOwner.profileImage} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7C4DFF]/20 to-[#7C4DFF]/5 flex items-center justify-center text-xl font-bold text-[#7C4DFF]">
                    {selectedOwner.name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-lg">{selectedOwner.name || '(이름 없음)'}</p>
                    {selectedOwner.isProtected && (
                      <Shield size={16} className="text-[#7C4DFF]" fill="#7C4DFF" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{selectedOwner.email || ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {providerLabel(selectedOwner.provider)}
                    {statusBadge(selectedOwner.status)}
                  </div>
                </div>
              </div>

              {/* 핵심 정보 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <Calendar size={13} /> 가입일시
                  </span>
                  <span className="text-gray-900 text-sm font-medium">{formatDate(selectedOwner.createdAt)}</span>
                </div>
                {selectedOwner.updatedAt && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <RefreshCw size={13} /> 최근활동
                    </span>
                    <span className="text-gray-900 text-sm font-medium">{formatDate(selectedOwner.updatedAt)}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <Phone size={13} /> 전화번호
                  </span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedOwner.phone ? (
                      <a href={`tel:${selectedOwner.phone}`} className="text-[#7C4DFF] hover:underline">
                        {selectedOwner.phone}
                      </a>
                    ) : '미입력'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <MapPin size={13} /> 매장주소
                  </span>
                  <span className="text-gray-900 text-sm font-medium">{selectedOwner.address || '미입력'}</span>
                </div>
                {selectedOwner.businessName && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <Building2 size={13} /> 업체명
                    </span>
                    <span className="text-gray-900 text-sm font-bold">{selectedOwner.businessName}</span>
                  </div>
                )}
                {selectedOwner.status === 'DEACTIVATED' && selectedOwner.deactivatedAt && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <UserMinus size={13} /> 탈퇴일시
                    </span>
                    <span className="text-red-600 text-sm font-medium">{formatDate(selectedOwner.deactivatedAt)}</span>
                  </div>
                )}
              </div>

              {/* 거절 사유 */}
              {selectedOwner.status === 'REJECTED' && selectedOwner.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={15} className="text-red-500" />
                    <p className="text-sm text-red-600 font-semibold">거절 사유</p>
                  </div>
                  <p className="text-sm text-red-700">{selectedOwner.rejectionReason}</p>
                </div>
              )}

              {/* 사업자등록증 */}
              {selectedOwner.businessLicenseUrl && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">사업자등록증</p>
                  <img
                    src={selectedOwner.businessLicenseUrl}
                    alt="사업자등록증"
                    className="w-full rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {/* 모달 내 액션 버튼 */}
              {selectedOwner.status === 'PENDING' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedOwner.id)}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> 승인
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOwner(null);
                      openRejectModal(selectedOwner);
                    }}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> 거절
                  </button>
                </div>
              )}
              {selectedOwner.status === 'REJECTED' && (
                <button
                  onClick={() => handleApprove(selectedOwner.id)}
                  className="w-full bg-[#7C4DFF] text-white py-3 rounded-xl font-semibold hover:bg-[#6B3FEE] transition-colors"
                >
                  재승인
                </button>
              )}
              {selectedOwner.status === 'APPROVED' && (
                <button
                  onClick={() => {
                    setSelectedOwner(null);
                    setDeactivateModalOwner(selectedOwner);
                  }}
                  className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <UserMinus size={18} /> 탈퇴 처리
                </button>
              )}
              {selectedOwner.status === 'DEACTIVATED' && (
                <button
                  onClick={() => handleReactivate(selectedOwner.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> 복원
                </button>
              )}

              {/* 보호 토글 버튼 (모달 내) */}
              <button
                onClick={() => {
                  handleToggleProtected(selectedOwner);
                  setSelectedOwner(null);
                }}
                className={`w-full border py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  selectedOwner.isProtected
                    ? 'border-purple-200 text-[#7C4DFF] hover:bg-purple-50'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Shield size={16} />
                {selectedOwner.isProtected ? '보호 해제' : '보호 설정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 입력 모달 */}
      {rejectModalOwner && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setRejectModalOwner(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <X size={16} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">거절 사유 입력</h3>
              </div>
              <button onClick={() => setRejectModalOwner(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{rejectModalOwner.name || '(이름 없음)'}</strong>님의 가입을 거절합니다.
              <br />
              사장님에게 보여질 거절 사유를 입력해주세요.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">거절 사유 *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="예: 사업자등록증이 불분명합니다. 선명한 사진으로 다시 제출해주세요."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-red-500 text-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModalOwner(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejecting || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {rejecting ? '처리 중...' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탈퇴 확인 모달 */}
      {deactivateModalOwner && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => !deactivating && setDeactivateModalOwner(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                  <UserMinus size={18} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">탈퇴 처리 확인</h3>
              </div>
              <button
                onClick={() => !deactivating && setDeactivateModalOwner(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={deactivating}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-1">정말 탈퇴시키겠습니까?</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deactivateModalOwner.name || '(이름 없음)'}</span>
                {deactivateModalOwner.businessName && (
                  <span className="text-gray-500"> ({deactivateModalOwner.businessName})</span>
                )}
              </p>
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> 소속 매장이 비활성화됩니다
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Check size={12} /> 데이터는 보존됩니다
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateModalOwner(null)}
                disabled={deactivating}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleDeactivateConfirm}
                disabled={deactivating}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {deactivating ? '처리 중...' : '탈퇴 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
