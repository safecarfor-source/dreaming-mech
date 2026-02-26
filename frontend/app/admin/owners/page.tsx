'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminOwnerApi } from '@/lib/api';
import { Owner } from '@/types';
import { Check, X, Clock, UserCheck, UserX, Eye, Building2, AlertCircle, Phone, MapPin, Calendar } from 'lucide-react';

type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  // 거절 사유 모달 상태
  const [rejectModalOwner, setRejectModalOwner] = useState<Owner | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

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
  }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm('이 사장님을 승인하시겠습니까?')) return;
    try {
      await adminOwnerApi.approve(id);
      setSelectedOwner(null);
      fetchOwners();
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
    } catch {
      alert('거절에 실패했습니다.');
    } finally {
      setRejecting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
            <Clock size={11} /> 대기중
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
            <UserCheck size={11} /> 승인됨
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
            <UserX size={11} /> 거절됨
          </span>
        );
      default:
        return null;
    }
  };

  const providerLabel = (provider: string) => {
    return provider === 'naver' ? (
      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">네이버</span>
    ) : (
      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-medium">카카오</span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${mins}`;
  };

  // 필터별 카운트
  const counts = {
    all: owners.length,
    PENDING: owners.filter(o => o.status === 'PENDING').length,
    APPROVED: owners.filter(o => o.status === 'APPROVED').length,
    REJECTED: owners.filter(o => o.status === 'REJECTED').length,
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사장님 관리</h1>
        <p className="text-gray-500 mt-1">회원가입 요청을 승인/거절하고 사장님 정보를 확인합니다</p>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: '전체', count: counts.all },
          { value: 'PENDING', label: '대기중', count: counts.PENDING },
          { value: 'APPROVED', label: '승인됨', count: counts.APPROVED },
          { value: 'REJECTED', label: '거절됨', count: counts.REJECTED },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as FilterStatus)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              filter === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                filter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">로딩 중...</div>
      ) : owners.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">해당하는 사장님이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* 카드 헤더 */}
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                {/* 프로필 + 이름 */}
                <div className="flex items-center gap-3 min-w-0">
                  {owner.profileImage ? (
                    <img
                      src={owner.profileImage}
                      alt=""
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                      {owner.name?.[0] || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-base">
                        {owner.name || '(이름 없음)'}
                      </span>
                      {statusBadge(owner.status)}
                      {providerLabel(owner.provider)}
                    </div>
                    <span className="text-xs text-gray-400">{owner.email || ''}</span>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {owner.businessLicenseUrl && (
                    <button
                      onClick={() => setSelectedOwner(owner)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="사업자등록증 보기"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  {owner.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="승인"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => openRejectModal(owner)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="거절"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  {owner.status === 'REJECTED' && (
                    <button
                      onClick={() => handleApprove(owner.id)}
                      className="text-sm px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                    >
                      재승인
                    </button>
                  )}
                </div>
              </div>

              {/* 카드 상세 정보 */}
              <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50 grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 가입일시 */}
                <div className="flex items-start gap-1.5">
                  <Calendar size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">가입일시</p>
                    <p className="text-xs font-medium text-gray-700">{formatDate(owner.createdAt)}</p>
                  </div>
                </div>

                {/* 전화번호 */}
                <div className="flex items-start gap-1.5">
                  <Phone size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">전화번호</p>
                    <p className="text-xs font-medium text-gray-700">
                      {owner.phone ? (
                        <a href={`tel:${owner.phone}`} className="text-purple-600 hover:underline">
                          {owner.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">미입력</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 매장 주소 */}
                <div className="flex items-start gap-1.5 md:col-span-2">
                  <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">매장 주소</p>
                    <p className="text-xs font-medium text-gray-700">
                      {owner.address || <span className="text-gray-400">미입력</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* 업체명 + 거절 사유 */}
              {(owner.businessName || (owner.status === 'REJECTED' && owner.rejectionReason)) && (
                <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
                  {owner.businessName && (
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-800">{owner.businessName}</span>
                    </div>
                  )}
                  {owner.status === 'REJECTED' && owner.rejectionReason && (
                    <div className="flex items-center gap-1.5 text-red-500">
                      <AlertCircle size={13} />
                      <span className="text-xs">거절 사유: {owner.rejectionReason}</span>
                    </div>
                  )}
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
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
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
                  <img src={selectedOwner.profileImage} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600">
                    {selectedOwner.name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedOwner.name || '(이름 없음)'}</p>
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
                <div className="flex gap-3">
                  <span className="text-gray-400 text-sm w-20 flex-shrink-0 flex items-center gap-1">
                    <Phone size={13} /> 전화번호
                  </span>
                  <span className="text-gray-900 text-sm font-medium">
                    {selectedOwner.phone ? (
                      <a href={`tel:${selectedOwner.phone}`} className="text-purple-600 hover:underline">
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

              {/* 승인/거절 버튼 */}
              {selectedOwner.status === 'PENDING' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedOwner.id)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> 승인
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOwner(null);
                      openRejectModal(selectedOwner);
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} /> 거절
                  </button>
                </div>
              )}
              {selectedOwner.status === 'REJECTED' && (
                <button
                  onClick={() => handleApprove(selectedOwner.id)}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  재승인
                </button>
              )}
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
              <h3 className="text-lg font-bold text-gray-900">거절 사유 입력</h3>
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
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {rejecting ? '처리 중...' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
