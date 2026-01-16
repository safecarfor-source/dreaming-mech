# Phase 3: Frontend 기본 구조

## 🎯 목표
타입 정의, API 클라이언트, 유틸리티 함수를 설정합니다.

---

## Step 3-1: 타입 정의

### `frontend/types/index.ts`
```typescript
export interface Mechanic {
  id: number;
  name: string;
  location: string;
  phone: string;
  description?: string;
  address: string;
  mapLat: number;
  mapLng: number;
  mainImageUrl?: string;
  galleryImages?: string[];
  youtubeUrl?: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: number;
  email: string;
  name?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
}
```

### 커밋
```bash
git add .
git commit -m "feat(frontend): 타입 정의"
```

---

## Step 3-2: API 클라이언트

### `frontend/lib/api.ts`
```typescript
import axios from 'axios';
import { Mechanic } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mechanic API
export const mechanicsApi = {
  getAll: () => api.get<Mechanic[]>('/mechanics'),
  getOne: (id: number) => api.get<Mechanic>(`/mechanics/${id}`),
  create: (data: Partial<Mechanic>) => api.post<Mechanic>('/mechanics', data),
  update: (id: number, data: Partial<Mechanic>) =>
    api.patch<Mechanic>(`/mechanics/${id}`, data),
  delete: (id: number) => api.delete(`/mechanics/${id}`),
  incrementClick: (id: number) => api.post(`/mechanics/${id}/click`),
};

// Maps API
export const mapsApi = {
  geocode: (address: string) =>
    api.get('/maps/geocode', { params: { address } }),
  reverseGeocode: (lat: number, lng: number) =>
    api.get('/maps/reverse', { params: { lat, lng } }),
};

export default api;
```

### 커밋
```bash
git add .
git commit -m "feat(frontend): API 클라이언트 설정"
```

---

## Step 3-3: Naver Maps 유틸리티

### `frontend/utils/mapUtils.ts`
```typescript
// 유튜브 쇼츠 URL을 임베디드 URL로 변환
export function convertShortsUrl(url: string): string {
  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  return url;
}

// 좌표 유효성 검증
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// 주소 포맷팅
export function formatAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}
```

### 커밋
```bash
git add .
git commit -m "feat(frontend): 유틸리티 함수 추가"
```

---

## Step 3-4: Tailwind 커스텀 설정 (Phase 0에서 완료)

이미 완료되어 있습니다!

---

## ✅ Phase 3 완료

```bash
git push origin feature/phase-3-frontend-basics
# GitHub PR → Squash Merge
```

**다음**: [Phase 4 - 메인 페이지](./phase-4.md)
