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
}

export function useMechanicForm({ mechanic, mode, apiBasePath = '/mechanics', redirectPath = '/admin/mechanics' }: UseMechanicFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<MechanicFormData>({
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
    // 상세 정보
    operatingHours: mechanic?.operatingHours || null,
    specialties: mechanic?.specialties || [],
    isVerified: mechanic?.isVerified || false,
    parkingAvailable: mechanic?.parkingAvailable ?? null,
    paymentMethods: mechanic?.paymentMethods || [],
    holidays: mechanic?.holidays || null,
    galleryImages: mechanic?.galleryImages || [],
    // 사장님 연결
    ownerId: mechanic?.ownerId ?? null,
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

      if (!response.ok) throw new Error('저장 실패');

      alert(mode === 'create' ? '정비사가 추가되었습니다!' : '수정되었습니다!');
      router.push(redirectPath);
    } catch (error) {
      console.error(error);
      alert('저장에 실패했습니다.');
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
