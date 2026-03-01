import axios, { AxiosRequestConfig } from 'axios';
import { Mechanic, Inquiry, UnreadCount, ApiResponse, QuoteRequest, Review, SyncMessage, SyncStats, TireInquiry, Customer, ServiceInquiry, ServiceType, ServiceInquiryStatus, UnifiedInquiry, UnifiedInquiryCount } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// ✅ Axios 인터셉터로 자동 인증 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // 해당 역할의 인증 정보만 선택적으로 삭제 (다른 스토리지는 보존)
        const path = window.location.pathname;
        if (path.startsWith('/owner') && !path.includes('/owner/login')) {
          localStorage.removeItem('owner-auth-storage');
          window.location.href = '/owner/login';
        } else if (path.startsWith('/admin') && !path.includes('/admin/login')) {
          localStorage.removeItem('auth-storage');
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ✅ 타입 안전한 config 빌더 함수
interface RequestConfig {
  params?: Record<string, string | number | boolean>;
}

function buildConfig({ params }: RequestConfig = {}): AxiosRequestConfig {
  const config: AxiosRequestConfig = {};
  if (params) {
    config.params = params;
  }
  return config;
}

// Mechanic API
export const mechanicsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Mechanic[]>>('/mechanics', { params }),
  getOne: (id: number) => api.get<Mechanic>(`/mechanics/${id}`),
  create: (data: Partial<Mechanic>) => api.post<Mechanic>('/mechanics', data),
  update: (id: number, data: Partial<Mechanic>) =>
    api.patch<Mechanic>(`/mechanics/${id}`, data),
  delete: (id: number) => api.delete(`/mechanics/${id}`),
  incrementClick: (id: number) => api.post(`/mechanics/${id}/click`),
  reorder: (orderedIds: number[]) =>
    api.patch('/mechanics/reorder', { orderedIds }, buildConfig()),
  getByRegion: (sido: string, sigungu: string) =>
    api.get<{ data: Array<{ id: number; name: string; address: string; location: string }> }>(
      `/mechanics?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}`
    ),
};

// Maps API
export const mapsApi = {
  geocode: (address: string) =>
    api.get('/maps/geocode', { params: { address } }),
  reverseGeocode: (lat: number, lng: number) =>
    api.get('/maps/reverse', { params: { lat, lng } }),
};

// Analytics API
// Note: Authentication is now handled automatically via HttpOnly cookies
export const analyticsApi = {
  trackPageView: (path: string, referer?: string) =>
    api.post('/analytics/pageview', { path, referer }),
  getSiteStats: (days?: number) =>
    api.get('/analytics/site-stats', buildConfig({
      params: days !== undefined ? { days } : {}
    })),
  getSiteStatsByMonth: (year: number, month: number) =>
    api.get('/analytics/site-stats-by-month', buildConfig({
      params: { year, month }
    })),
  getSiteMonthlyStats: (months: number = 12) =>
    api.get('/analytics/site-stats-monthly', buildConfig({
      params: { months }
    })),
  getMechanicMonthlyClicks: (id: number, months: number = 6) =>
    api.get(`/analytics/mechanic/${id}/monthly`, buildConfig({
      params: { months }
    })),
  getAllMechanicsMonthlyClicks: (months: number = 6) =>
    api.get('/analytics/all-mechanics-monthly', buildConfig({
      params: { months }
    })),
  getTopMechanicsByMonth: (year: number, month: number, limit: number = 5) =>
    api.get('/analytics/top-mechanics-by-month', buildConfig({
      params: { year, month, limit }
    })),
  getTopMechanics: (
    period: 'realtime' | 'daily' | 'monthly' = 'realtime',
    options?: {
      limit?: number;
      days?: number;
      months?: number;
    },
  ) =>
    api.get('/analytics/top-mechanics', buildConfig({
      params: {
        period,
        ...(options?.limit && { limit: options.limit }),
        ...(options?.days && { days: options.days }),
        ...(options?.months && { months: options.months }),
      },
    })),
};

// Owner Auth API
export const ownerAuthApi = {
  // /owner/* 경로는 JWT 전략에서 owner_token만 사용 → admin 동시 로그인 시에도 올바른 사장님 프로필 반환
  getProfile: () => api.get('/owner/profile'),
  updateProfile: (data: { phone?: string; businessName?: string; address?: string; name?: string }) =>
    api.patch('/owner/profile', data),
  submitBusinessLicense: (data: { businessLicenseUrl: string; businessName: string }) =>
    api.post('/owner/business-license', data),
  reapply: (data: { businessLicenseUrl: string; businessName: string }) =>
    api.post('/owner/reapply', data),
  setSignupInquiry: (inquiryId: number) =>
    api.patch('/owner/signup-inquiry', { inquiryId }),
};

// 사장님용: 내 정비소 선택 고객 문의 API
export const ownerInquiriesApi = {
  getAll: () => api.get<Array<{
    id: number;
    name: string | null;
    phone: string | null;
    regionSido: string;
    regionSigungu: string;
    serviceType: string;
    description: string | null;
    vehicleNumber: string | null;
    vehicleModel: string | null;
    status: string;
    sharedAt: string | null;
    shareClickCount: number;
    trackingCode: string | null;
    trackingLink: { id: number; code: string; name: string; description: string | null } | null;
    mechanic: { id: number; name: string; address: string } | null;
    createdAt: string;
  }>>('/owner/service-inquiries'),
};

// Upload API
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Owner Mechanics API (사장님 매장 관리)
export const ownerMechanicsApi = {
  getAll: () => api.get<Mechanic[]>('/owner/mechanics'),
  create: (data: Partial<Mechanic>) => api.post<Mechanic>('/owner/mechanics', data),
  update: (id: number, data: Partial<Mechanic>) =>
    api.patch<Mechanic>(`/owner/mechanics/${id}`, data),
  delete: (id: number) => api.delete(`/owner/mechanics/${id}`),
};

// Admin Owner API (관리자용 사장님 관리)
export const adminOwnerApi = {
  getAll: (status?: string) =>
    api.get('/admin/owners', { params: status ? { status } : {} }),
  approve: (id: number) => api.patch(`/admin/owners/${id}/approve`),
  reject: (id: number, reason?: string) =>
    api.patch(`/admin/owners/${id}/reject`, { reason }),
};

// Admin Customer API (관리자용 고객 관리)
export const adminCustomerApi = {
  getAll: () => api.get('/admin/customers'),
  delete: (id: number) => api.delete(`/admin/customers/${id}`),
};

// Inquiry API (문의)
export const inquiryApi = {
  // 공개: 문의 등록
  create: (data: {
    type: 'CUSTOMER' | 'MECHANIC';
    name: string;
    phone: string;
    businessName?: string;
    content: string;
  }) => api.post<Inquiry>('/inquiries', data),

  // 관리자: 문의 목록
  getAll: (params?: {
    type?: 'CUSTOMER' | 'MECHANIC';
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<Inquiry[]>>('/inquiries', { params }),

  // 관리자: 문의 상세
  getOne: (id: number) => api.get<Inquiry>(`/inquiries/${id}`),

  // 관리자: 안읽은 문의 수
  getUnreadCount: () => api.get<UnreadCount>('/inquiries/unread-count'),

  // 관리자: 답변
  reply: (id: number, reply: string) =>
    api.patch<Inquiry>(`/inquiries/${id}/reply`, { reply }),

  // 관리자: 삭제
  delete: (id: number) => api.delete(`/inquiries/${id}`),
};

// Quote Request API (견적 요청)
export const quoteRequestApi = {
  // 공개: 견적 요청 생성
  create: (data: {
    mechanicId: number;
    customerName: string;
    customerPhone: string;
    carModel: string;
    carYear?: string;
    description: string;
    images?: string[];
  }) => api.post<QuoteRequest>('/quote-requests', data),

  // 관리자: 전체 목록
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<QuoteRequest[]>>('/quote-requests', { params }),

  // 사장님: 정비소별 목록
  getByMechanic: (mechanicId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<QuoteRequest[]>>(`/quote-requests/mechanic/${mechanicId}`, { params }),

  // 관리자/사장님: 상세
  getOne: (id: number) => api.get<QuoteRequest>(`/quote-requests/${id}`),

  // 관리자/사장님: 상태 변경
  updateStatus: (id: number, status: string) =>
    api.patch(`/quote-requests/${id}/status`, { status }),

  // 관리자: 미확인 건수
  getUnreadCount: () => api.get<number>('/quote-requests/unread-count'),
};

// Review API (리뷰)
export const reviewApi = {
  // 공개: 리뷰 작성
  create: (data: {
    mechanicId: number;
    nickname: string;
    content: string;
    rating: number;
  }) => api.post<Review>('/reviews', data),

  // 공개: 정비소별 승인된 리뷰
  getByMechanic: (mechanicId: number) =>
    api.get<Review[]>(`/reviews/mechanic/${mechanicId}`),

  // 관리자: 전체 리뷰 목록
  getAll: (params?: { page?: number; limit?: number; approved?: string }) =>
    api.get<ApiResponse<Review[]>>('/reviews', { params }),

  // 관리자: 승인
  approve: (id: number) => api.patch(`/reviews/${id}/approve`),

  // 관리자: 반려
  reject: (id: number) => api.patch(`/reviews/${id}/reject`),

  // 관리자: 삭제
  delete: (id: number) => api.delete(`/reviews/${id}`),

  // 관리자: 미승인 리뷰 수
  getPendingCount: () => api.get<number>('/reviews/pending-count'),
};

// Tire Inquiry API (타이어 문의)
export const tireInquiryApi = {
  // 공개: 타이어 문의 생성
  create: (data: {
    region: string;
    subRegion?: string;
    tireSize: string;
    serviceType?: string;
    carModel?: string;
    images?: string[];
    description?: string;
  }) => api.post<TireInquiry>('/tire-inquiries', data),

  // 관리자: 전체 목록
  getAll: (params?: { page?: number; limit?: number; status?: string; region?: string }) =>
    api.get<ApiResponse<TireInquiry[]>>('/tire-inquiries', { params }),

  // 관리자: 상세
  getOne: (id: number) => api.get<TireInquiry>(`/tire-inquiries/${id}`),

  // 관리자: 상태 변경
  updateStatus: (id: number, status: string, adminNote?: string) =>
    api.patch(`/tire-inquiries/${id}/status`, { status, adminNote }),

  // 관리자: 미확인 건수
  getUnreadCount: () => api.get<{ count: number }>('/tire-inquiries/unread-count'),

  // 관리자: 삭제
  delete: (id: number) => api.delete(`/tire-inquiries/${id}`),
};

// Sync API (📱💻 폰-컴퓨터 동기화)
export const syncApi = {
  // 지시 생성
  create: (data: {
    content: string;
    type?: string;
    deviceFrom?: string;
    priority?: number;
    images?: string[];
  }) => api.post<SyncMessage>('/sync', data),

  // 목록 조회
  getAll: (params?: { status?: string; deviceFrom?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<SyncMessage[]>>('/sync', { params }),

  // 통계
  getStats: () => api.get<SyncStats>('/sync/stats'),

  // 상세 조회
  getOne: (id: number) => api.get<SyncMessage>(`/sync/${id}`),

  // 업데이트 (상태 변경, 답변)
  update: (id: number, data: { status?: string; reply?: string; priority?: number }) =>
    api.patch<SyncMessage>(`/sync/${id}`, data),

  // 삭제
  delete: (id: number) => api.delete(`/sync/${id}`),
};

// 고객 인증 API
export const customerAuthApi = {
  getProfile: () => api.get<ApiResponse<Customer>>('/auth/customer/profile'),
  updatePhone: (phone: string) => api.patch<ApiResponse<Customer>>('/auth/customer/phone', { phone }),
  updateTracking: (trackingCode: string) => api.patch('/auth/customer/tracking', { trackingCode }),
};

// 서비스 문의 API
export const serviceInquiryApi = {
  create: (data: {
    name?: string;
    regionSido: string;
    regionSigungu: string;
    serviceType: ServiceType;
    description?: string;
    phone: string;
    vehicleNumber?: string;
    vehicleModel?: string;
    trackingCode?: string;
    mechanicId?: number;
  }) => api.post<ApiResponse<ServiceInquiry>>('/service-inquiries', data),

  getPublic: (id: number) => api.get<ApiResponse<ServiceInquiry>>(`/service-inquiries/${id}`),

  // 관리자용
  getAll: (page = 1, limit = 20) =>
    api.get<ApiResponse<{ data: ServiceInquiry[]; total: number }>>(`/service-inquiries?page=${page}&limit=${limit}`),

  getFull: (id: number) => api.get<ApiResponse<ServiceInquiry>>(`/service-inquiries/${id}/full`),

  updateStatus: (id: number, status: ServiceInquiryStatus) =>
    api.patch<ApiResponse<ServiceInquiry>>(`/service-inquiries/${id}/status`, { status }),

  getShareMessage: (id: number) => api.get<ApiResponse<string>>(`/service-inquiries/${id}/share-message`),
};

// 통합 문의 API
export const unifiedInquiryApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ data: UnifiedInquiry[]; total: number; page: number; limit: number; totalPages: number }>(`/unified-inquiries?page=${page}&limit=${limit}`),

  getCount: () =>
    api.get<UnifiedInquiryCount>('/unified-inquiries/count'),

  getPublic: (type: string, id: number) =>
    api.get(`/unified-inquiries/${type.toLowerCase()}/${id}`),

  getPublicStats: () =>
    api.get<{ recentCount: number }>('/unified-inquiries/public-stats'),

  updateStatus: (type: string, id: number, status: string) =>
    api.patch(`/unified-inquiries/${type.toLowerCase()}/${id}/status`, { status }),

  getShareMessage: (type: string, id: number) =>
    api.get<{ message: string }>(`/unified-inquiries/${type.toLowerCase()}/${id}/share-message`),

  delete: (type: string, id: number) =>
    api.delete(`/unified-inquiries/${type.toLowerCase()}/${id}`),
};

// 추적 링크 API
export const trackingLinkApi = {
  // Admin: 추적 링크 생성
  create: (data: { name: string; description?: string; targetUrl?: string }) =>
    api.post('/tracking-links', data),

  // Admin: 전체 목록 (통계 포함)
  getAll: () => api.get('/tracking-links'),

  // Admin: 상세 (일별 추이 + 고객/문의 목록)
  getOne: (id: number) => api.get(`/tracking-links/${id}`),

  // Admin: 수정
  update: (id: number, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.patch(`/tracking-links/${id}`, data),

  // Admin: 삭제
  delete: (id: number) => api.delete(`/tracking-links/${id}`),

  // 공개: 클릭 기록
  recordClick: (code: string) =>
    api.post('/tracking-links/click', { code }),
};

// Community API (커뮤니티 Q&A)
export const communityApi = {
  getPosts: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/community/posts', { params }),
  getPost: (id: number) => api.get(`/community/posts/${id}`),
  createPost: (data: { title: string; content: string; category: string }) =>
    api.post('/community/posts', data),
  createComment: (postId: number, data: { content: string; parentId?: number }) =>
    api.post(`/community/posts/${postId}/comments`, data),
  toggleLike: (postId: number) => api.post(`/community/posts/${postId}/like`),
  deletePost: (id: number) => api.delete(`/community/posts/${id}`),
};

export default api;
