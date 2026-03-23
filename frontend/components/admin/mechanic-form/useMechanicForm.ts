import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Mechanic, OperatingHours, HolidayInfo } from '@/types';
import { isValidYouTubeUrl, sanitizeYouTubeUrl } from '@/lib/youtube';

export interface MechanicFormData {
  name: string;
  location: string;
  phone: string;
  description: string;
  address: string;
  mapLat: number;
  mapLng: number;
  mainImageUrl: string;
  youtubeUrl: string;
  youtubeLongUrl: string;
  isActive: boolean;
  isPremium: boolean;
  // 상세 정보
  operatingHours: OperatingHours | null;
  specialties: string[];
  isVerified: boolean;
  parkingAvailable: boolean | null;
  paymentMethods: string[];
  holidays: HolidayInfo | null;
  galleryImages: string[];
  // 사장님 연결
  ownerId: number | null;
}

interface UseMechanicFormProps {
  mechanic?: Mechanic;
  mode: 'create' | 'edit';
  apiBasePath?: string;    // 기본: '/mechanics', Owner: '/owner/mechanics'
  redirectPath?: string;   // 기본: '/admin/mechanics', Owner: '/owner/mechanics'
  draftKey?: string;       // localStorage 임시저장 키
}

export function useMechanicForm({ mechanic, mode, apiBasePath = '/mechanics', redirectPath = '/admin/mechanics', draftKey }: UseMechanicFormProps) {
  const router = useRouter();

  // localStorage 임시저장 데이터 불러오기 (신규 등록 + draftKey 있을 때만)
  const getInitialFormData = (): MechanicFormData => {
    const defaults: MechanicFormData = {
      name: mechanic?.name || '',
      location: mechanic?.location || '',
      phone: mechanic?.phone || '',
      description: mechanic?.description || '',
      address: mechanic?.address || '',
      mapLat: mechanic?.mapLat ? Number(mechanic.mapLat) : 37.5665,
      mapLng: mechanic?.mapLng ? Number(mechanic.mapLng) : 126.978,
      mainImageUrl: mechanic?.mainImageUrl || '',
      youtubeUrl: mechanic?.youtubeUrl || '',
      youtubeLongUrl: mechanic?.youtubeLongUrl || '',
      isActive: mechanic?.isActive ?? true,
      isPremium: mechanic?.isPremium ?? false,
      operatingHours: mechanic?.operatingHours || null,
      specialties: mechanic?.specialties || [],
      isVerified: mechanic?.isVerified || false,
      parkingAvailable: mechanic?.parkingAvailable ?? null,
      paymentMethods: mechanic?.paymentMethods || [],
      holidays: mechanic?.holidays || null,
      galleryImages: mechanic?.galleryImages || [],
      ownerId: mechanic?.ownerId ?? null,
    };

    if (mode === 'create' && draftKey) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<MechanicFormData>;
          return { ...defaults, ...parsed };
        }
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }

    return defaults;
  };

  const [formData, setFormData] = useState<MechanicFormData>(getInitialFormData);

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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/maps/geocode?address=${encodeURIComponent(
        formData.address
      )}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('주소 검색 실패');
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        mapLat: Number(data.lat),
        mapLng: Number(data.lng),
        address: data.address,
      }));

      alert('지도에서 마커를 드래그하여 위치를 조정할 수 있습니다.');
    } catch (error) {
      console.error('주소 검색 에러:', error);
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
      alert('올바른 YouTube 숏폼 URL을 입력해주세요.\n예: https://www.youtube.com/shorts/VIDEO_ID');
      return;
    }

    if (formData.youtubeLongUrl && !isValidYouTubeUrl(formData.youtubeLongUrl)) {
      alert('올바른 YouTube 롱폼 URL을 입력해주세요.\n예: https://www.youtube.com/watch?v=VIDEO_ID');
      return;
    }

    // Sanitize and prepare data
    const sanitizedData = {
      ...formData,
      // Convert empty strings to null so backend clears the field
      mainImageUrl: formData.mainImageUrl.trim() || null,
      youtubeUrl: formData.youtubeUrl
        ? (sanitizeYouTubeUrl(formData.youtubeUrl) || null)
        : null,
      youtubeLongUrl: formData.youtubeLongUrl
        ? (sanitizeYouTubeUrl(formData.youtubeLongUrl) || null)
        : null,
      // 상세 정보
      galleryImages: formData.galleryImages,
      operatingHours: formData.operatingHours,
      specialties: formData.specialties,
      isVerified: formData.isVerified,
      parkingAvailable: formData.parkingAvailable,
      paymentMethods: formData.paymentMethods,
      holidays: formData.holidays,
      ownerId: formData.ownerId,
      isPremium: formData.isPremium,
    };

    setIsSaving(true);
    try {
      const url =
        mode === 'create'
          ? `${process.env.NEXT_PUBLIC_API_URL}${apiBasePath}`
          : `${process.env.NEXT_PUBLIC_API_URL}${apiBasePath}/${mechanic?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        if (errData?.errors && Array.isArray(errData.errors)) {
          const fieldLabels: Record<string, string> = {
            name: '정비소명', phone: '전화번호', address: '주소',
            location: '지역', mapLat: '위도', mapLng: '경도',
            description: '설명', mainImageUrl: '대표 이미지',
            youtubeUrl: '유튜브 숏폼 URL', youtubeLongUrl: '유튜브 롱폼 URL',
            operatingHours: '영업시간', specialties: '전문 분야',
            paymentMethods: '결제 수단', holidays: '휴무일',
          };
          const msgs = errData.errors.map((e: any) => {
            const label = fieldLabels[e.field] || e.field;
            return `• ${label}: ${e.message}`;
          });
          throw new Error('저장 실패:\n' + msgs.join('\n'));
        }
        throw new Error(errData?.message || '저장 실패');
      }

      // 임시저장 데이터 삭제
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      alert(mode === 'create' ? '정비사가 추가되었습니다!' : '수정되었습니다!');
      router.push(redirectPath);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    isSearching,
    isSaving,
    handleChange,
    handleAddressSearch,
    handleMarkerDragEnd,
    handleSubmit,
  };
}
