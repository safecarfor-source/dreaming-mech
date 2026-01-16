# Phase 5: 정비사 상세 모달

## 🎯 목표
드래곤타이어 스타일로 슬라이드업되는 전체화면 모달을 만듭니다.

---

## Step 5-1: Zustand 스토어

### `frontend/lib/store.ts`
```typescript
import { create } from 'zustand';
import type { Mechanic } from '@/types';

interface ModalStore {
  isOpen: boolean;
  mechanic: Mechanic | null;
  open: (mechanic: Mechanic) => void;
  close: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  mechanic: null,
  open: (mechanic) => set({ isOpen: true, mechanic }),
  close: () => set({ isOpen: false, mechanic: null }),
}));
```

---

## Step 5-2 & 5-3: 모달 컴포넌트 (지도 포함)

### `frontend/components/MechanicModal.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Eye } from 'lucide-react';
import { useModalStore } from '@/lib/store';
import { mechanicsApi } from '@/lib/api';
import NaverMapView from './NaverMapView';
import YouTubeEmbed from './YouTubeEmbed';

export default function MechanicModal() {
  const { isOpen, mechanic, close } = useModalStore();

  // 클릭수 증가
  useEffect(() => {
    if (isOpen && mechanic) {
      mechanicsApi.incrementClick(mechanic.id).catch(console.error);
    }
  }, [isOpen, mechanic]);

  if (!mechanic) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* 모달 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl z-50 overflow-auto"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <X size={24} />
            </button>

            <div className="p-8">
              {/* 대표 이미지 */}
              {mechanic.mainImageUrl && (
                <img
                  src={mechanic.mainImageUrl}
                  alt={mechanic.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              {/* 정보 */}
              <h2 className="text-4xl font-bold mb-4">{mechanic.name}</h2>

              <div className="space-y-3 text-lg mb-8">
                <div className="flex items-center gap-2">
                  <MapPin />
                  <span>{mechanic.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone />
                  <a href={`tel:${mechanic.phone}`} className="text-blue-600">
                    {mechanic.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Eye />
                  <span>조회수 {mechanic.clickCount + 1}</span>
                </div>
              </div>

              {mechanic.description && (
                <p className="text-gray-700 mb-8">{mechanic.description}</p>
              )}

              {/* 지도 */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">위치</h3>
                <NaverMapView
                  lat={mechanic.mapLat}
                  lng={mechanic.mapLng}
                  name={mechanic.name}
                />
              </div>

              {/* 유튜브 */}
              {mechanic.youtubeUrl && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">소개 영상</h3>
                  <YouTubeEmbed url={mechanic.youtubeUrl} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Step 5-4: 유튜브 임베디드

### `frontend/components/YouTubeEmbed.tsx`
```typescript
import { convertShortsUrl } from '@/utils/mapUtils';

export default function YouTubeEmbed({ url }: { url: string }) {
  const embedUrl = convertShortsUrl(url);

  return (
    <div className="aspect-[9/16] max-w-sm mx-auto">
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
```

---

## Step 5-5: 네이버 지도 (읽기 전용)

### `frontend/components/NaverMapView.tsx`
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface Props {
  lat: number;
  lng: number;
  name: string;
}

export default function NaverMapView({ lat, lng, name }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = new (window as any).naver.maps.Map(mapRef.current, {
      center: new (window as any).naver.maps.LatLng(lat, lng),
      zoom: 17,
    });

    new (window as any).naver.maps.Marker({
      position: new (window as any).naver.maps.LatLng(lat, lng),
      map,
      title: name,
    });
  }, [isLoaded, lat, lng, name]);

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        onLoad={() => setIsLoaded(true)}
      />
      <div ref={mapRef} className="w-full h-[400px] rounded-lg" />
    </>
  );
}
```

---

## 메인 페이지에 적용

### `frontend/app/page.tsx` 수정
```typescript
import MechanicModal from '@/components/MechanicModal';
import { useModalStore } from '@/lib/store';

// ...

<MechanicCard
  key={mechanic.id}
  mechanic={mechanic}
  onClick={() => useModalStore.getState().open(mechanic)}
/>

// 모달 컴포넌트 추가
<MechanicModal />
```

---

## ✅ Phase 5 완료

```bash
git push origin feature/phase-5-modal
```

**다음**: [Phase 6 - 관리자 페이지](./phase-6.md)
