'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerLayout from '@/components/owner/OwnerLayout';
import MechanicForm from '@/components/admin/MechanicForm';
import { userAuthApi } from '@/lib/api';
import { User as UserType } from '@/types';
import { CheckCircle2, X } from 'lucide-react';

const DRAFT_KEY = 'mechanic_draft';

export default function OwnerNewMechanicPage() {
  const router = useRouter();
  const [owner, setOwner] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

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

  // 승인된 사용자 — 일반 등록 폼
  if (owner?.businessStatus === 'APPROVED') {
    return (
      <OwnerLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">매장 등록</h1>

          {/* 임시저장 데이터 있으면 안내 배너 */}
          {hasDraft && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
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

          <MechanicForm
            mode="create"
            apiBasePath="/owner/mechanics"
            redirectPath="/owner/mechanics"
            draftKey={DRAFT_KEY}
          />
        </div>
      </OwnerLayout>
    );
  }

  // 미승인 사용자 — 임시저장 모드
  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">매장 정보 미리 입력</h1>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xl flex-shrink-0">📋</div>
            <div>
              <p className="text-sm font-semibold text-amber-800">사업자 승인 전이에요</p>
              <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
                지금 매장 정보를 미리 입력해두면, 승인 후 바로 등록할 수 있어요.
                <br />
                <span className="font-medium">임시저장</span>을 눌러 저장해두세요.
              </p>
            </div>
          </div>
        </div>

        <MechanicForm
          mode="create"
          apiBasePath="/owner/mechanics"
          redirectPath="/owner/mechanics"
          draftKey={DRAFT_KEY}
          draftMode
          onDraftSave={() => setShowDraftModal(true)}
        />
      </div>

      {/* 임시저장 완료 모달 */}
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
    </OwnerLayout>
  );
}
