'use client';

import { useRouter } from 'next/navigation';
import type { Mechanic } from '@/types';
import { useMechanicForm } from './mechanic-form/useMechanicForm';
import BasicInfoSection from './mechanic-form/BasicInfoSection';
import LocationSection from './mechanic-form/LocationSection';
import AdditionalInfoSection from './mechanic-form/AdditionalInfoSection';

interface MechanicFormProps {
  mechanic?: Mechanic;
  mode: 'create' | 'edit';
  apiBasePath?: string;
  redirectPath?: string;
}

export default function MechanicForm({ mechanic, mode, apiBasePath, redirectPath }: MechanicFormProps) {
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
  } = useMechanicForm({ mechanic, mode, apiBasePath, redirectPath });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 기본 정보 */}
      <BasicInfoSection
        formData={formData}
        onChange={handleChange}
        onActiveChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
      />

      {/* 위치 정보 */}
      <LocationSection
        formData={formData}
        isSearching={isSearching}
        onChange={handleChange}
        onAddressSearch={handleAddressSearch}
        onMarkerDragEnd={handleMarkerDragEnd}
      />

      {/* 추가 정보 */}
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
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm"
        >
          {isSaving ? '저장 중...' : mode === 'create' ? '추가하기' : '수정하기'}
        </button>
      </div>
    </form>
  );
}
