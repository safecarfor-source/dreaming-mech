'use client';

import { useRouter } from 'next/navigation';
import type { Mechanic } from '@/types';
import { useMechanicForm } from './mechanic-form/useMechanicForm';
import BasicInfoSection from './mechanic-form/BasicInfoSection';
import LocationSection from './mechanic-form/LocationSection';
import AdditionalInfoSection from './mechanic-form/AdditionalInfoSection';
import DetailInfoSection from './mechanic-form/DetailInfoSection';
import GallerySection from './mechanic-form/GallerySection';
import OwnerLinkSection from './mechanic-form/OwnerLinkSection';

interface MechanicFormProps {
  mechanic?: Mechanic;
  mode: 'create' | 'edit';
  apiBasePath?: string;
  redirectPath?: string;
  // 임시저장 관련
  draftKey?: string;
  draftMode?: boolean;
  onDraftSave?: () => void;
  // 사업자 미승인 시 publish 차단 콜백 (데이터를 임시저장 후 팝업 열기)
  onPublishBlocked?: (formData: object) => void;
}

export default function MechanicForm({ mechanic, mode, apiBasePath, redirectPath, draftKey, draftMode = false, onDraftSave, onPublishBlocked }: MechanicFormProps) {
  const router = useRouter();
  const {
    formData,
    setFormData,
    isSearching,
    isSaving,
    handleChange,
    handleAddressSearch,
    handleMarkerDragEnd,
    handleSubmit,
  } = useMechanicForm({ mechanic, mode, apiBasePath, redirectPath, draftKey });

  const isAdmin = !apiBasePath?.includes('owner');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 기본 정보 */}
      <BasicInfoSection
        formData={formData}
        onChange={handleChange}
        onActiveChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
        onPremiumChange={(isPremium) => setFormData((prev) => ({ ...prev, isPremium }))}
      />

      {/* 위치 정보 */}
      <LocationSection
        formData={formData}
        isSearching={isSearching}
        onChange={handleChange}
        onAddressSearch={handleAddressSearch}
        onMarkerDragEnd={handleMarkerDragEnd}
      />

      {/* 상세 정보 (운영시간, 전문분야, 주차, 결제, 휴무 등) */}
      <DetailInfoSection
        formData={formData}
        onFieldChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        isAdmin={isAdmin}
      />

      {/* 갤러리 */}
      <GallerySection
        images={formData.galleryImages}
        onImagesChange={(images) => setFormData((prev) => ({ ...prev, galleryImages: images }))}
      />

      {/* 사장님 연결 (관리자 전용) */}
      {isAdmin && (
        <OwnerLinkSection
          ownerId={formData.ownerId}
          onOwnerChange={(ownerId) => setFormData((prev) => ({ ...prev, ownerId }))}
        />
      )}

      {/* 추가 정보 (대표 이미지, 유튜브) */}
      <AdditionalInfoSection
        formData={formData}
        onChange={handleChange}
        onImageUpload={(url) => setFormData((prev) => ({ ...prev, mainImageUrl: url }))}
      />

      {/* 버튼 */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-gray-400 bg-white text-gray-800 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all shadow-sm"
        >
          취소
        </button>

        {onPublishBlocked ? (
          // 사업자 미승인: 임시저장 버튼 + 추가하기(팝업) 버튼
          <>
            <button
              type="button"
              onClick={() => {
                if (draftKey) {
                  localStorage.setItem(draftKey, JSON.stringify(formData));
                }
                onDraftSave?.();
              }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 transition-all shadow-sm"
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={() => {
                if (draftKey) {
                  localStorage.setItem(draftKey, JSON.stringify(formData));
                }
                onPublishBlocked(formData);
              }}
              className="px-8 py-3 bg-[#7C4DFF] hover:bg-[#6B3FE8] text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/50 focus:ring-offset-2 transition-all shadow-sm"
            >
              사업자 등록증 제출
            </button>
          </>
        ) : draftMode ? (
          // 임시저장 전용 모드 (onPublishBlocked 없음)
          <button
            type="button"
            onClick={() => {
              if (draftKey) {
                localStorage.setItem(draftKey, JSON.stringify(formData));
              }
              onDraftSave?.();
            }}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 transition-all shadow-sm"
          >
            임시저장
          </button>
        ) : (
          // 일반 submit
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#7C4DFF] hover:bg-[#6B3FE8] disabled:bg-gray-400 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/50 focus:ring-offset-2 transition-all shadow-sm"
          >
            {isSaving ? '저장 중...' : mode === 'create' ? '추가하기' : '수정하기'}
          </button>
        )}
      </div>
    </form>
  );
}
