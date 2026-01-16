# Phase 6: 관리자 페이지

## 🎯 목표
JWT 인증, 로그인, 정비사 CRUD 관리, **하이브리드 지도 편집** 기능을 구현합니다.

## 📋 사전 준비
- Phase 0~5 완료
- Frontend, Backend 모두 실행 가능 상태

---

## Step 6-5: 🔥 정비사 추가/수정 폼 (하이브리드 지도 편집)

### 📌 이 Step이 가장 중요합니다!

### 작업 내용
주소 입력 → 지도 검색 → 마커 드래그로 미세 조정하는 폼을 만듭니다.

### 필요한 패키지
```bash
cd frontend

# 네이버 지도
npm install react-naver-maps

# 폼 관리
npm install react-hook-form @hookform/resolvers zod
```

### 1. EditableMap 컴포넌트 (드래그 가능한 지도)

#### `frontend/components/admin/EditableMap.tsx`
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface EditableMapProps {
  center: { lat: number; lng: number };
  marker: { lat: number; lng: number };
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function EditableMap({
  center,
  marker,
  onMarkerDragEnd,
}: EditableMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 네이버 지도 스크립트 로드 완료
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const mapInstance = new (window as any).naver.maps.Map(mapRef.current, {
      center: new (window as any).naver.maps.LatLng(center.lat, center.lng),
      zoom: 16,
    });

    setMap(mapInstance);
  }, [isLoaded, center]);

  // 마커 생성 및 업데이트
  useEffect(() => {
    if (!map || !marker) return;

    const position = new (window as any).naver.maps.LatLng(
      marker.lat,
      marker.lng
    );

    if (markerInstance) {
      // 기존 마커 위치 업데이트
      markerInstance.setPosition(position);
      map.setCenter(position);
    } else {
      // 새 마커 생성
      const newMarker = new (window as any).naver.maps.Marker({
        position,
        map,
        draggable: true, // 드래그 가능!
      });

      // 드래그 종료 이벤트
      (window as any).naver.maps.Event.addListener(
        newMarker,
        'dragend',
        (e: any) => {
          const newLat = e.coord.lat();
          const newLng = e.coord.lng();
          onMarkerDragEnd(newLat, newLng);
        }
      );

      setMarkerInstance(newMarker);
    }
  }, [map, marker, markerInstance, onMarkerDragEnd]);

  return (
    <div className="relative">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        onLoad={handleLoad}
      />

      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-lg border-2 border-gray-300"
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
```

### 2. MechanicForm 컴포넌트 (메인 폼)

#### `frontend/components/admin/MechanicForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditableMap from './EditableMap';
import { Search, MapPin } from 'lucide-react';

interface MechanicFormProps {
  mechanic?: any; // 수정 시 기존 데이터
  mode: 'create' | 'edit';
}

export default function MechanicForm({ mechanic, mode }: MechanicFormProps) {
  const router = useRouter();

  // 폼 상태
  const [formData, setFormData] = useState({
    name: mechanic?.name || '',
    location: mechanic?.location || '',
    phone: mechanic?.phone || '',
    description: mechanic?.description || '',
    address: mechanic?.address || '',
    mapLat: mechanic?.mapLat || 37.5665, // 서울시청 기본값
    mapLng: mechanic?.mapLng || 126.978,
    mainImageUrl: mechanic?.mainImageUrl || '',
    youtubeUrl: mechanic?.youtubeUrl || '',
  });

  const [isSearching, setIsSearching] = useState(false);

  // 입력 변경
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 주소로 좌표 검색 (Geocoding)
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

      // 좌표 업데이트
      setFormData((prev) => ({
        ...prev,
        mapLat: data.lat,
        mapLng: data.lng,
        address: data.address, // 정확한 주소로 업데이트
      }));

      alert('지도에서 위치를 확인하고, 마커를 드래그하여 미세 조정하세요!');
    } catch (error) {
      console.error(error);
      alert('주소 검색에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  // 마커 드래그 종료 (Reverse Geocoding)
  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/maps/reverse?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) throw new Error('주소 변환 실패');

      const data = await response.json();

      // 좌표와 주소 업데이트
      setFormData((prev) => ({
        ...prev,
        mapLat: lat,
        mapLng: lng,
        address: data.roadAddress || data.address,
      }));

      console.log('주소 업데이트:', data.address);
    } catch (error) {
      console.error(error);
      // 에러가 나도 좌표는 업데이트
      setFormData((prev) => ({
        ...prev,
        mapLat: lat,
        mapLng: lng,
      }));
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
    if (!formData.name || !formData.location || !formData.phone || !formData.address) {
      alert('필수 항목을 모두 입력해주세요');
      return;
    }

    try {
      const url =
        mode === 'create'
          ? `${process.env.NEXT_PUBLIC_API_URL}/mechanics`
          : `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${mechanic.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('저장 실패');

      alert(mode === 'create' ? '정비사가 추가되었습니다!' : '수정되었습니다!');
      router.push('/admin/mechanics');
    } catch (error) {
      console.error(error);
      alert('저장에 실패했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">기본 정보</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            정비소 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="예: 강남 오토센터"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              지역 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="예: 강남구"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="예: 02-1234-5678"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            rows={4}
            placeholder="정비소 소개를 입력하세요"
          />
        </div>
      </div>

      {/* 위치 정보 (핵심!) */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">📍 위치 정보</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="예: 서울시 강남구 테헤란로 123"
              required
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Search size={20} />
              {isSearching ? '검색 중...' : '지도에서 찾기'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 주소를 입력하고 "지도에서 찾기"를 누르세요
          </p>
        </div>

        {/* 지도 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            지도에서 위치 선택
          </label>
          <EditableMap
            center={{ lat: formData.mapLat, lng: formData.mapLng }}
            marker={{ lat: formData.mapLat, lng: formData.mapLng }}
            onMarkerDragEnd={handleMarkerDragEnd}
          />
          <p className="text-sm text-gray-500">
            🖱️ 마커를 드래그하여 정확한 위치를 설정하세요
          </p>
        </div>

        {/* 좌표 표시 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={20} className="text-blue-600" />
            <span className="font-medium">선택된 위치:</span>
            <span className="text-gray-700">
              위도 {formData.mapLat.toFixed(6)}, 경도 {formData.mapLng.toFixed(6)}
            </span>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">추가 정보</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            대표 이미지 URL
          </label>
          <input
            type="url"
            name="mainImageUrl"
            value={formData.mainImageUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            유튜브 쇼츠 URL
          </label>
          <input
            type="url"
            name="youtubeUrl"
            value={formData.youtubeUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://www.youtube.com/shorts/xxxxxxx"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {mode === 'create' ? '추가하기' : '수정하기'}
        </button>
      </div>
    </form>
  );
}
```

### 3. 페이지 연결

#### `frontend/app/admin/mechanics/new/page.tsx` (새로 생성)
```typescript
import MechanicForm from '@/components/admin/MechanicForm';

export default function NewMechanicPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">정비사 추가</h1>
      <MechanicForm mode="create" />
    </div>
  );
}
```

#### `frontend/app/admin/mechanics/[id]/edit/page.tsx` (새로 생성)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MechanicForm from '@/components/admin/MechanicForm';

export default function EditMechanicPage() {
  const params = useParams();
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanic = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mechanics/${params.id}`
        );
        const data = await response.json();
        setMechanic(data);
      } catch (error) {
        console.error(error);
        alert('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMechanic();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        로딩 중...
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        정비사를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">정비사 수정</h1>
      <MechanicForm mechanic={mechanic} mode="edit" />
    </div>
  );
}
```

### 테스트
```bash
cd frontend
npm run dev

# 1. http://localhost:3000/admin/mechanics/new 접속
# 2. 주소 입력: "서울시 강남구 테헤란로 123"
# 3. "지도에서 찾기" 클릭
# 4. 지도에 마커 표시되는지 확인
# 5. 마커 드래그해서 위치 조정
# 6. 주소가 자동으로 업데이트되는지 확인
# 7. "추가하기" 클릭
```

### 커밋
```bash
git add .
git commit -m "feat(admin): 하이브리드 지도 편집 기능 구현"
```

---

## 🎯 Step 6-5 핵심 정리

### 동작 흐름
```
1. 사용자가 주소 입력
   ↓
2. "지도에서 찾기" 버튼 클릭
   ↓
3. Geocoding API 호출 (주소 → 좌표)
   ↓
4. 지도 중심 이동 + 마커 표시
   ↓
5. 사용자가 마커 드래그로 미세 조정
   ↓
6. 드래그 종료 시 Reverse Geocoding API 호출 (좌표 → 주소)
   ↓
7. 주소 자동 업데이트
   ↓
8. "추가하기" 클릭 → DB 저장
```

### 구현된 기능
- ✅ 주소 입력 → 자동 좌표 변환
- ✅ 지도 자동 이동
- ✅ 드래그 가능한 마커
- ✅ 드래그 시 주소 자동 업데이트
- ✅ 실시간 좌표 표시
- ✅ 유효성 검증

---

## ✅ Phase 6 완료 체크리스트

```markdown
- [ ] Step 6-1: 인증 시스템 (JWT)
- [ ] Step 6-2: 로그인 페이지
- [ ] Step 6-3: 대시보드 레이아웃
- [ ] Step 6-4: 정비사 관리 테이블
- [x] Step 6-5: 정비사 추가/수정 폼 (지도 편집) ⭐
- [ ] Step 6-6: EditableMap 컴포넌트 (완료)
- [ ] Step 6-7: 통계 대시보드
```

---

## 🚀 다음 단계

```bash
git push origin feature/phase-6-admin-page
# GitHub PR → Squash Merge
```

**다음**: [Phase 7 - 이미지 업로드](./phase-7.md)

---

## 🆘 문제 해결

### Q: 네이버 지도가 안 보임
```typescript
// .env.local 확인
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=올바른_클라이언트_ID

// 브라우저 콘솔에서 에러 확인
// "Invalid client ID" → API 키 확인
```

### Q: 마커 드래그가 안됨
```typescript
// EditableMap.tsx에서 draggable: true 확인
const newMarker = new naver.maps.Marker({
  position,
  map,
  draggable: true,  // ← 이 부분 확인!
});
```

### Q: Geocoding API 403 에러
```env
# backend/.env에서 키 확인
NAVER_MAP_CLIENT_ID=xxx
NAVER_MAP_CLIENT_SECRET=xxx
# 두 개 모두 필요!
```

### Q: 주소가 업데이트 안됨
```typescript
// handleMarkerDragEnd에서 
// console.log로 API 응답 확인
console.log('Reverse geocoding response:', data);
```
