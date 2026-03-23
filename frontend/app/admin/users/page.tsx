'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminUserApi } from '@/lib/api';
import { User } from '@/types';
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

// businessStatus 필터 타입
type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE' | 'DEACTIVATED';
type SortOption = 'newest' | 'name' | 'status';

// 배지 갱신 이벤트 dispatch
const refreshBadges = () => {
  window.dispatchEvent(new Event('badges-refresh'));
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // 기본 탭: PENDING (사업자 신청)
  const [filter, setFilter] = useState<FilterStatus>('PENDING');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // 거절 사유 모달 상태
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // 탈퇴 확인 모달 상태
  const [deactivateModalUser, setDeactivateModalUser] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchUsers = async () => {
    try {
      // businessStatus 필터: all이면 undefined, DEACTIVATED는 별도 처리
      const statusParam = filter === 'all' ? undefined : filter;
      const res = await adminUserApi.getAll(statusParam);
      setUsers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // 페이지 진입 시 배지 갱신
  useEffect(() => {
    refreshBadges();
  }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('이 회원을 승인하시겠습니까?')) return;
    try {
      await adminUserApi.approve(id);
      setSelectedUser(null);
      fetchUsers();
      refreshBadges();
    } catch {
      alert('승인에 실패했습니다.');
    }
  };

  const openRejectModal = (user: User) => {
    setRejectModalUser(user);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalUser) return;
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    setRejecting(true);
    try {
      await adminUserApi.reject(rejectModalUser.id, rejectReason.trim());
      setRejectModalUser(null);
      setSelectedUser(null);
      fetchUsers();
      refreshBadges();
    } catch {
      alert('거절에 실패했습니다.');
    } finally {
      setRejecting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateModalUser) return;
    setDeactivating(true);
    try {
      await adminUserApi.deactivate(deactivateModalUser.id);
      setDeactivateModalUser(null);
      setSelectedUser(null);
      fetchUsers();
      refreshBadges();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || '탈퇴 처리에 실패했습니다.';
      alert(message);
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async (id: number) => {
    if (!confirm('이 회원을 복원하시겠습니까?')) return;
    try {
      await adminUserApi.reactivate(id);
      setSelectedUser(null);
      fetchUsers();
      refreshBadges();
    } catch {
      alert('복원에 실패했습니다.');
    }
  };

  const handleToggleProtected = async (user: User) => {
    const action = user.isProtected ? '보호 해제' : '보호 설정';
    if (!confirm(`이 회원을 ${action}하시겠습니까?`)) return;
    try {
      await adminUserApi.toggleProtected(user.id);
      fetchUsers();
      refreshBadges();
    } catch {
      alert(`${action}에 실패했습니다.`);
    }
  };

  // 검색 + 정렬 적용
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.nickname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.businessName?.toLowerCase().includes(q) ||
          u.address?.toLowerCase().includes(q)
      );
    }

    // 정렬
    switch (sortOption) {
      case 'newest':
        break;
      case 'name':
        result.sort((a, b) => ((a.name || a.nickname || '').localeCompare(b.name || b.nickname || '', 'ko')));
        break;
      case 'status':
        const statusOrder: Record<string, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2, NONE: 3, DEACTIVATED: 4 };
        result.sort((a, b) => (statusOrder[a.businessStatus] ?? 9) - (statusOrder[b.businessStatus] ?? 9));
        break;
    }

    return result;
  }, [users, searchQuery, sortOption]);

  const businessStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <Clock size={11} /> 사업자 신청
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
      case 'NONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 rounded-full">
            <Users size={11} /> 일반 회원
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

  const providerLabel = (provider?: string) => {
    if (!provider) return null;
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

  const counts = useMemo(() => {
    if (filter === 'all') {
      return {
        all: users.length,
        PENDING: users.filter(u => u.businessStatus === 'PENDING').length,
        APPROVED: users.filter(u => u.businessStatus === 'APPROVED').length,
        REJECTED: users.filter(u => u.businessStatus === 'REJECTED').length,
        NONE: users.filter(u => u.businessStatus === 'NONE').length,
        DEACTIVATED: 0,
      };
    }
    return {
      all: 0,
      PENDING: filter === 'PENDING' ? users.length : 0,
      APPROVED: filter === 'APPROVED' ? users.length : 0,
      REJECTED: filter === 'REJECTED' ? users.length : 0,
      NONE: filter === 'NONE' ? users.length : 0,
      DEACTIVATED: filter === 'DEACTIVATED' ? users.length : 0,
    };
  }, [users, filter]);

  const filterTabs = [
    { value: 'all' as FilterStatus, label: '전체', count: counts.all },
    { value: 'PENDING' as FilterStatus, label: '사업자 신청', count: counts.PENDING },
    { value: 'APPROVED' as FilterStatus, label: '승인됨', count: counts.APPROVED },
    { value: 'REJECTED' as FilterStatus, label: '거절됨', count: counts.REJECTED },
    { value: 'NONE' as FilterStatus, label: '일반 회원', count: counts.NONE },
    { value: 'DEACTIVATED' as FilterStatus, label: '탈퇴', count: counts.DEACTIVATED },
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
                <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
                <p className="text-sm text-gray-500 mt-0.5">가입 승인/거절 · 사업자 신청 · 일반 회원 관리</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchUsers(); }}
            className="p-2.5 text-gray-400 hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/5 rounded-xl transition-all"
            title="새로고침"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 통계 카드 (전체 탭에서만) */}
      {filter === 'all' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '사업자 신청', count: counts.PENDING, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock },
            { label: '승인됨', count: counts.APPROVED, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: UserCheck },
            { label: '거절됨', count: counts.REJECTED, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: UserX },
            { label: '일반 회원', count: counts.NONE, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', icon: Users },
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
          검색 결과: <strong className="text-gray-900">{filteredUsers.length}</strong>건
          {filteredUsers.length !== users.length && (
            <span className="text-gray-400"> (전체 {users.length}건)</span>
          )}
        </p>
      )}

      {/* 메인 리스트 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={24} className="text-[#7C4DFF] animate-spin" />
          <span className="text-sm text-gray-500">로딩 중...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? '검색 결과가 없습니다' : '해당하는 회원이 없습니다'}
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
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                user.businessStatus === 'PENDING'
                  ? 'border-amber-200 ring-1 ring-amber-100'
                  : user.businessStatus === 'DEACTIVATED'
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-100'
              }`}
            >
              {/* PENDING 상태 강조 띠 */}
              {user.businessStatus === 'PENDING' && (
                <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
              )}

              {/* 카드 헤더 */}
              <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                {/* 프로필 + 이름 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C4DFF]/20 to-[#7C4DFF]/5 flex items-center justify-center text-sm font-bold text-[#7C4DFF]">
                        {(user.name || user.nickname || '?')[0]}
                      </div>
                    )}
                    {/* 상태 인디케이터 */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      user.businessStatus === 'PENDING' ? 'bg-amber-400' :
                      user.businessStatus === 'APPROVED' ? 'bg-emerald-400' :
                      user.businessStatus === 'REJECTED' ? 'bg-red-400' :
                      user.businessStatus === 'NONE' ? 'bg-blue-400' :
                      'bg-gray-300'
                    }`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-[15px]">
                        {user.name || user.nickname || '(이름 없음)'}
                      </span>
                      {user.isProtected && (
                        <Shield size={13} className="text-[#7C4DFF]" fill="#7C4DFF" />
                      )}
                      {providerLabel(user.provider)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{user.email || ''}</span>
                      {user.updatedAt && (
                        <span className="text-[10px] text-gray-400">· {timeAgo(user.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 상태 배지 + 액션 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {businessStatusBadge(user.businessStatus)}

                  {user.businessLicenseUrl && (
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-[#7C4DFF] hover:bg-[#7C4DFF]/5 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye size={16} />
                    </button>
                  )}

                  {/* PENDING: 승인/거절 */}
                  {user.businessStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check size={13} /> 승인
                      </button>
                      <button
                        onClick={() => openRejectModal(user)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X size={13} /> 거절
                      </button>
                    </>
                  )}

                  {/* APPROVED: 탈퇴 */}
                  {user.businessStatus === 'APPROVED' && (
                    <button
                      onClick={() => setDeactivateModalUser(user)}
                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserMinus size={13} />
                    </button>
                  )}

                  {/* REJECTED: 재승인 */}
                  {user.businessStatus === 'REJECTED' && (
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-3 py-1.5 text-xs font-medium text-[#7C4DFF] bg-[#7C4DFF]/5 hover:bg-[#7C4DFF]/10 rounded-lg transition-colors"
                    >
                      재승인
                    </button>
                  )}

                  {/* DEACTIVATED: 복원 */}
                  {user.businessStatus === 'DEACTIVATED' && (
                    <button
                      onClick={() => handleReactivate(user.id)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={13} /> 복원
                    </button>
                  )}
                </div>
              </div>

              {/* 카드 정보 */}
              {(user.businessName || user.phone || user.address || user.businessStatus === 'PENDING') && (
                <div className="border-t border-gray-50 px-4 py-2.5 bg-gray-50/60 flex items-center gap-4 flex-wrap">
                  {user.businessName && (
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Building2 size={12} className="text-gray-400" />
                      {user.businessName}
                    </span>
                  )}
                  {user.phone && (
                    <a href={`tel:${user.phone}`} className="text-xs text-[#7C4DFF] hover:underline flex items-center gap-1">
                      <Phone size={12} />
                      {user.phone}
                    </a>
                  )}
                  {user.address && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      {user.address}
                    </span>
                  )}
                  {/* 사업자 등록증 제출 여부 뱃지 (PENDING 탭에서 구분용) */}
                  {user.businessStatus === 'PENDING' && (
                    user.businessLicenseUrl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        <Check size={10} /> 사업자 등록증 제출됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-400 border border-gray-200 rounded-full">
                        미제출
                      </span>
                    )
                  )}
                </div>
              )}

              {/* 거절 사유 / 탈퇴 일시 */}
              {user.businessStatus === 'REJECTED' && user.rejectionReason && (
                <div className="border-t border-red-100 px-4 py-2 bg-red-50/50">
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} />
                    거절: {user.rejectionReason}
                  </p>
                </div>
              )}
              {user.businessStatus === 'DEACTIVATED' && user.deactivatedAt && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar size={11} />
                    탈퇴: {formatDate(user.deactivatedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 사업자등록증 상세 모달 */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-xs text-gray-400">회원 상세 정보</p>
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.name || selectedUser.nickname || '(이름 없음)'}</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* 프로필 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {selectedUser.profileImage ? (
                  <img src={selectedUser.profileImage} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7C4DFF]/20 to-[#7C4DFF]/5 flex items-center justify-center text-xl font-bold text-[#7C4DFF]">
                    {(selectedUser.name || selectedUser.nickname || '?')[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-lg">{selectedUser.name || selectedUser.nickname || '(이름 없음)'}</p>
                    {selectedUser.isProtected && (
                      <Shield size={16} className="text-[#7C4DFF]" fill="#7C4DFF" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{selectedUser.email || ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {providerLabel(selectedUser.provider)}
                    {businessStatusBadge(selectedUser.businessStatus)}
                  </div>
                </div>
              </div>

              {/* 핵심 정보 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <Calendar size={13} /> 가입일시
                  </span>
                  <span className="text-gray-900 text-sm font-medium">{formatDate(selectedUser.createdAt)}</span>
                </div>
                {selectedUser.updatedAt && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <RefreshCw size={13} /> 최근활동
                    </span>
                    <span className="text-gray-900 text-sm font-medium">{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <Phone size={13} /> 전화번호
                  </span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedUser.phone ? (
                      <a href={`tel:${selectedUser.phone}`} className="text-[#7C4DFF] hover:underline">
                        {selectedUser.phone}
                      </a>
                    ) : '미입력'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <MapPin size={13} /> 매장주소
                  </span>
                  <span className="text-gray-900 text-sm font-medium">{selectedUser.address || '미입력'}</span>
                </div>
                {selectedUser.businessName && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <Building2 size={13} /> 업체명
                    </span>
                    <span className="text-gray-900 text-sm font-bold">{selectedUser.businessName}</span>
                  </div>
                )}
                {selectedUser.businessStatus === 'DEACTIVATED' && selectedUser.deactivatedAt && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                      <UserMinus size={13} /> 탈퇴일시
                    </span>
                    <span className="text-red-600 text-sm font-medium">{formatDate(selectedUser.deactivatedAt)}</span>
                  </div>
                )}
              </div>

              {/* 거절 사유 */}
              {selectedUser.businessStatus === 'REJECTED' && selectedUser.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={15} className="text-red-500" />
                    <p className="text-sm text-red-600 font-semibold">거절 사유</p>
                  </div>
                  <p className="text-sm text-red-700">{selectedUser.rejectionReason}</p>
                </div>
              )}

              {/* 사업자등록증 */}
              {selectedUser.businessLicenseUrl && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">사업자등록증</p>
                  <img
                    src={selectedUser.businessLicenseUrl}
                    alt="사업자등록증"
                    className="w-full rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {/* 모달 내 액션 버튼 */}
              {selectedUser.businessStatus === 'PENDING' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedUser.id)}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> 승인
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      openRejectModal(selectedUser);
                    }}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> 거절
                  </button>
                </div>
              )}
              {selectedUser.businessStatus === 'REJECTED' && (
                <button
                  onClick={() => handleApprove(selectedUser.id)}
                  className="w-full bg-[#7C4DFF] text-white py-3 rounded-xl font-semibold hover:bg-[#6B3FEE] transition-colors"
                >
                  재승인
                </button>
              )}
              {selectedUser.businessStatus === 'APPROVED' && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setDeactivateModalUser(selectedUser);
                  }}
                  className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <UserMinus size={18} /> 탈퇴 처리
                </button>
              )}
              {selectedUser.businessStatus === 'DEACTIVATED' && (
                <button
                  onClick={() => handleReactivate(selectedUser.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> 복원
                </button>
              )}

              {/* 보호 토글 버튼 */}
              <button
                onClick={() => {
                  handleToggleProtected(selectedUser);
                  setSelectedUser(null);
                }}
                className={`w-full border py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  selectedUser.isProtected
                    ? 'border-purple-200 text-[#7C4DFF] hover:bg-purple-50'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Shield size={16} />
                {selectedUser.isProtected ? '보호 해제' : '보호 설정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 입력 모달 */}
      {rejectModalUser && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setRejectModalUser(null)}
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
              <button onClick={() => setRejectModalUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{rejectModalUser.name || rejectModalUser.nickname || '(이름 없음)'}</strong>님의 신청을 거절합니다.
              <br />
              회원에게 보여질 거절 사유를 입력해주세요.
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
                onClick={() => setRejectModalUser(null)}
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
      {deactivateModalUser && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => !deactivating && setDeactivateModalUser(null)}
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
                onClick={() => !deactivating && setDeactivateModalUser(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={deactivating}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-1">정말 탈퇴시키겠습니까?</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{deactivateModalUser.name || deactivateModalUser.nickname || '(이름 없음)'}</span>
                {deactivateModalUser.businessName && (
                  <span className="text-gray-500"> ({deactivateModalUser.businessName})</span>
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
                onClick={() => setDeactivateModalUser(null)}
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
