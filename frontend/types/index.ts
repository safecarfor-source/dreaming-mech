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
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: number;
  email: string;
  name?: string;
}

export interface Owner {
  id: number;
  email?: string;
  name?: string;
  profileImage?: string;
  provider: 'naver' | 'kakao';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  _count?: { mechanics: number };
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

export type PeriodType = 'realtime' | 'daily' | 'monthly';

export interface TopMechanic {
  id: number;
  name: string;
  phoneNumber: string;
  address: string;
  clickCount: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
