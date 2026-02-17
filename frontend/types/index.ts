// 운영시간 타입
export interface OperatingHours {
  [day: string]: { open: string; close: string } | null;
}

// 휴무일 타입
export interface HolidayInfo {
  type: 'weekly' | 'custom' | 'none';
  days?: string[];
  dates?: string[];
  description?: string;
}

// 한줄 리뷰 타입
export interface Review {
  id: number;
  mechanicId: number;
  nickname: string;
  content: string;
  rating: number;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt: string;
  mechanic?: { id: number; name: string };
}

// 견적 요청 타입
export interface QuoteRequest {
  id: number;
  mechanicId: number;
  customerName: string;
  customerPhone: string;
  carModel: string;
  carYear?: string;
  description: string;
  images?: string[];
  status: 'PENDING' | 'VIEWED' | 'REPLIED' | 'COMPLETED' | 'CANCELLED';
  alimtalkSent: boolean;
  alimtalkSentAt?: string;
  mechanic?: {
    id: number;
    name: string;
    phone: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
  youtubeLongUrl?: string;
  // 상세 정보
  operatingHours?: OperatingHours | null;
  specialties?: string[];
  isVerified?: boolean;
  parkingAvailable?: boolean | null;
  paymentMethods?: string[];
  holidays?: HolidayInfo | null;
  reviews?: Review[];
  // 사장님 연결
  ownerId?: number | null;
  owner?: { id: number; name?: string; email?: string; businessName?: string };
  // 기본 필드
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
  provider: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  businessLicenseUrl?: string;
  businessName?: string;
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

// 문의 타입
export interface Inquiry {
  id: number;
  type: 'CUSTOMER' | 'MECHANIC';
  name: string;
  phone: string;
  businessName?: string;
  content: string;
  reply?: string;
  isRead: boolean;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCount {
  customer: number;
  mechanic: number;
  total: number;
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
