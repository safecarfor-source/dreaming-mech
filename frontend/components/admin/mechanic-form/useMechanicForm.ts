import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Mechanic } from '@/types';
import { isValidYouTubeUrl, sanitizeYouTubeUrl } from '@/lib/youtube';

interface MechanicFormData {
  name: string;
  location: string;
  phone: string;
  description: string;
  address: string;
  mapLat: number;
  mapLng: number;
  mainImageUrl: string;
  youtubeUrl: string;
  isActive: boolean;
}

interface UseMechanicFormProps {
  mechanic?: Mechanic;
  mode: 'create' | 'edit';
}

export function useMechanicForm({ mechanic, mode }: UseMechanicFormProps) {
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
        credentials: 'include',
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
