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
  kakaoOpenChatUrl?: string;
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
  phone?: string;
  address?: string;
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

// 📱💻 동기화 메시지 타입
export type SyncMessageType = 'INSTRUCTION' | 'NOTE' | 'LINK' | 'IMAGE';
export type SyncMessageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SyncMessage {
  id: number;
  content: string;
  type: SyncMessageType;
  status: SyncMessageStatus;
  deviceFrom: string;
  priority: number;
  images?: string[];
  reply?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SyncStats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

// 타이어 문의 타입
export type TireServiceType = 'REPLACEMENT' | 'REPAIR' | 'ALIGNMENT' | 'INSPECTION';
export type TireInquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';

export interface TireInquiry {
  id: number;
  region: string;
  subRegion?: string;
  tireSize: string;
  serviceType: TireServiceType;
  carModel?: string;
  images?: string[];
  description?: string;
  status: TireInquiryStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 1 타입들
export interface Customer {
  id: number;
  kakaoId: string;
  nickname?: string;
  phone: string;
  createdAt: string;
}

export type ServiceType = 'TIRE' | 'OIL' | 'BRAKE' | 'MAINTENANCE' | 'CONSULT';
export type ServiceInquiryStatus = 'PENDING' | 'SHARED' | 'CONNECTED' | 'COMPLETED';

export interface ServiceInquiry {
  id: number;
  customerId?: number;
  customer?: Customer;
  name?: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  regionSido: string;
  regionSigungu: string;
  serviceType: ServiceType;
  description?: string;
  status: ServiceInquiryStatus;
  kakaoOpenChatUrl?: string;
  createdAt: string;
}

export interface CustomerAuthState {
  customer: Customer | null;
  isLoading: boolean;
  login: (customer: Customer) => void;
  logout: () => void;
}

// 통합 문의 타입
export interface UnifiedInquiry {
  id: number;
  type: 'GENERAL' | 'SERVICE' | 'QUOTE' | 'TIRE';
  name?: string;
  phone?: string;
  regionSido?: string;
  regionSigungu?: string;
  regionDong?: string;
  serviceType?: string;
  description?: string;
  status: string;
  createdAt: string;
  shareUrl: string;
  businessName?: string;
  carModel?: string;
  mechanicName?: string;
  trackingLinkName?: string;
  // 공유 추적 데이터
  shareClickCount?: number;
  sharedAt?: string;
  signupOwnerCount?: number;
}

export interface UnifiedInquiryCount {
  total: number;
  inquiries: number;
  serviceInquiries: number;
  quoteRequests: number;
}

// 추적 링크 타입
export interface TrackingLink {
  id: number;
  code: string;
  name: string;
  description?: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // 통계 (목록 조회 시)
  totalClicks?: number;
  uniqueClicks?: number;
  totalInquiries?: number;
  totalSignups?: number;
  conversionRate?: number;
}

export interface TrackingLinkDetail extends TrackingLink {
  dailyClicks: { date: string; clicks: number }[];
  customers: { id: number; nickname?: string; phone?: string; createdAt: string }[];
  inquiries: { id: number; serviceType: string; regionSido: string; regionSigungu: string; phone?: string; createdAt: string }[];
}
