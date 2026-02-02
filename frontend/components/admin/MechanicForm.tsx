'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EditableMap from './EditableMap';
import ImageUpload from './ImageUpload';
import { Search, MapPin, Image } from 'lucide-react';
import type { Mechanic } from '@/types';
import { isValidYouTubeUrl, sanitizeYouTubeUrl } from '@/lib/youtube';

interface MechanicFormProps {
  mechanic?: Mechanic;
  mode: 'create' | 'edit';
}

export default function MechanicForm({ mechanic, mode }: MechanicFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: mechanic?.name || '',
    location: mechanic?.location || '',
    phone: mechanic?.phone || '',
    description: mechanic?.description || '',
    address: mechanic?.address || '',
    mapLat: mechanic?.mapLat ? Number(mechanic.mapLat) : 37.5665,
    mapLng: mechanic?.mapLng ? Number(mechanic.mapLng) : 126.978,
    mainImageUrl: mechanic?.mainImageUrl || '',
    youtubeUrl: mechanic?.youtubeUrl || '',
    isActive: mechanic?.isActive ?? true,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddressSearch = async () => {
    if (!formData.address.trim()) {
      alert('주소를 입력해주세요');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/maps/geocode?address=${encodeURIComponent(
          formData.address
        )}`
      );

      if (!response.ok) throw new Error('주소 검색 실패');

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        mapLat: Number(data.lat),
        mapLng: Number(data.lng),
        address: data.address,
      }));

      alert('지도에서 마커를 드래그하여 위치를 조정할 수 있습니다.');
    } catch (error) {
      console.error(error);
      alert('주소 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkerDragEnd = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/maps/reverse?lat=${lat}&lng=${lng}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          mapLat: lat,
          mapLng: lng,
          address: data.roadAddress || data.address || prev.address,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          mapLat: lat,
          mapLng: lng,
        }));
      }
    } catch (error) {
      setFormData((prev) => ({
        ...prev,
        mapLat: lat,
        mapLng: lng,
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.phone || !formData.address) {
      alert('필수 항목을 모두 입력해주세요');
      return;
    }

    // Validate YouTube URL if provided
    if (formData.youtubeUrl && !isValidYouTubeUrl(formData.youtubeUrl)) {
      alert('올바른 YouTube URL을 입력해주세요.\n예: https://www.youtube.com/watch?v=VIDEO_ID');
      return;
    }

    // Sanitize YouTube URL
    const sanitizedData = {
      ...formData,
      youtubeUrl: formData.youtubeUrl ? sanitizeYouTubeUrl(formData.youtubeUrl) || '' : '',
    };

    setIsSaving(true);
    try {
      const url =
        mode === 'create'
          ? `${process.env.NEXT_PUBLIC_API_URL}/mechanics`
          : `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${mechanic?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include HttpOnly cookie with JWT token
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) throw new Error('저장 실패');

      alert(mode === 'create' ? '정비사가 추가되었습니다!' : '수정되었습니다!');
      router.push('/admin/mechanics');
    } catch (error) {
      console.error(error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정비소 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            placeholder="예: 강남 오토센터"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지역 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
              placeholder="예: 강남구"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
              placeholder="예: 02-1234-5678"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            rows={4}
            placeholder="정비소 소개를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
          <select
            name="isActive"
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
          >
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>
      </div>

      {/* 위치 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="text-purple-600" />
          위치 정보
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
              placeholder="예: 서울시 강남구 테헤란로 123"
              required
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Search size={20} />
              {isSearching ? '검색 중...' : '지도에서 찾기'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            주소를 입력하고 "지도에서 찾기"를 클릭하세요.
          </p>
        </div>

        <EditableMap
          center={{ lat: formData.mapLat, lng: formData.mapLng }}
          marker={{ lat: formData.mapLat, lng: formData.mapLng }}
          onMarkerDragEnd={handleMarkerDragEnd}
        />

        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600">
            <span className="font-medium">선택된 좌표:</span> 위도{' '}
            {Number(formData.mapLat).toFixed(6)}, 경도 {Number(formData.mapLng).toFixed(6)}
          </p>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Image className="text-purple-600" />
          추가 정보
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대표 이미지
          </label>
          <ImageUpload
            currentImage={formData.mainImageUrl}
            onUpload={(url) => setFormData((prev) => ({ ...prev, mainImageUrl: url }))}
          />
          {formData.mainImageUrl && (
            <p className="text-xs text-gray-500 mt-2">
              {formData.mainImageUrl}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            유튜브 쇼츠 URL
          </label>
          <input
            type="url"
            name="youtubeUrl"
            value={formData.youtubeUrl}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            placeholder="https://www.youtube.com/shorts/xxxxxxx"
          />
        </div>
      </div>

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
