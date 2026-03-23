'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerLayout from '@/components/owner/OwnerLayout';
import MechanicForm from '@/components/admin/MechanicForm';
import { userAuthApi } from '@/lib/api';
import { User as UserType } from '@/types';
import { CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';

const DRAFT_KEY = 'mechanic_draft';

// 사업자 미승인 시 공개 유도 팝업
function BusinessRequiredModal({
  onSubmit,
  onLater,
}: {
  onSubmit: () => void;
  onLater: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onLater}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-[#7C4DFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-[#7C4DFF]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">정비소를 공개하려면</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          사업자 등록증을 제출해야 정비소를 메인 페이지에 공개할 수 있습니다.
          <br />
          <span className="text-gray-400 text-xs mt-1 block">입력하신 내용은 임시저장되었습니다.</span>
        </p>
        <button
          onClick={onSubmit}
          className="w-full bg-[#7C4DFF] text-white py-3 rounded-xl font-semibold hover:bg-[#6B3FE0] transition-colors flex items-center justify-center gap-2"
        >
          사업자 등록증 제출하기
          <ArrowRight size={16} />
        </button>
        <button
          onClick={onLater}
          className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          나중에 제출하기
        </button>
      </div>
    </div>
  );
}

// 임시저장 완료 안내 팝업
function DraftSavedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">임시저장 완료!</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          사업자 승인 후 다시 이 페이지에 오시면
          <br />
          입력한 정보가 자동으로 채워집니다.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#7C4DFF] text-white py-3 rounded-xl font-medium hover:bg-[#6B3FE0] transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function OwnerNewMechanicPage() {
  const router = useRouter();
  const [owner, setOwner] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // 사업자 미승인 팝업 상태
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAuthApi.getProfile();
        setOwner(res.data);
      } catch {
        // OwnerLayout에서 인증 처리
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // localStorage에 임시저장 데이터가 있는지 확인
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setHasDraft(true);
    }
  }, []);

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-16 text-gray-500">로딩 중...</div>
      </OwnerLayout>
    );
  }

  const isApproved = owner?.businessStatus === 'APPROVED';

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isApproved ? '매장 등록' : '매장 정보 미리 입력'}
          </h1>

          {/* 미승인 상태 안내 배너 */}
          {!isApproved && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="text-xl flex-shrink-0">📋</div>
              <div>
                <p className="text-sm font-semibold text-amber-800">사업자 승인 전이에요</p>
                <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
                  지금 매장 정보를 입력하고 임시저장해두세요.
                  <br />
                  <span className="font-medium">정비소 공개(배포)는 사업자 승인 후</span> 가능합니다.
                </p>
              </div>
            </div>
          )}

          {/* 임시저장 데이터 있으면 안내 배너 */}
          {hasDraft && (
            <div className="mb-2 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">임시저장된 데이터가 있습니다</p>
                  <p className="text-xs text-blue-600 mt-0.5">이전에 임시저장한 내용이 자동으로 채워집니다.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setHasDraft(false);
                  window.location.reload();
                }}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 flex-shrink-0"
              >
                <X size={14} />
                초기화
              </button>
            </div>
          )}
        </div>

        {isApproved ? (
          // 승인된 사용자 — 일반 등록 폼
          <MechanicForm
            mode="create"
            apiBasePath="/owner/mechanics"
            redirectPath="/owner/mechanics"
            draftKey={DRAFT_KEY}
          />
        ) : (
          // 미승인 사용자 — 임시저장 버튼 + 추가하기 클릭 시 사업자 팝업
          <MechanicForm
            mode="create"
            apiBasePath="/owner/mechanics"
            redirectPath="/owner/mechanics"
            draftKey={DRAFT_KEY}
            onDraftSave={() => setShowDraftModal(true)}
            onPublishBlocked={() => setShowBusinessModal(true)}
          />
        )}
      </div>

      {/* 임시저장 완료 모달 (임시저장 버튼 클릭 시) */}
      {showDraftModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDraftModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">임시저장 완료!</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              사업자 승인 후 다시 이 페이지에 오시면
              <br />
              입력한 정보가 자동으로 채워집니다.
            </p>
            <button
              onClick={() => {
                setShowDraftModal(false);
                router.push('/owner');
              }}
              className="w-full bg-[#7C4DFF] text-white py-3 rounded-xl font-medium hover:bg-[#6B3FE0] transition-colors"
            >
              대시보드로 이동
            </button>
            <button
              onClick={() => setShowDraftModal(false)}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              계속 수정하기
            </button>
          </div>
        </div>
      )}

      {/* 사업자 등록증 제출 유도 팝업 (추가하기 클릭 시) */}
      {showBusinessModal && (
        <BusinessRequiredModal
          onSubmit={() => {
            setShowBusinessModal(false);
            router.push('/owner/onboarding');
          }}
          onLater={() => {
            setShowBusinessModal(false);
            setShowDraftSavedModal(true);
          }}
        />
      )}

      {/* 임시저장 완료 안내 (나중에 선택 시) */}
      {showDraftSavedModal && (
        <DraftSavedModal onClose={() => setShowDraftSavedModal(false)} />
      )}
    </OwnerLayout>
  );
}
