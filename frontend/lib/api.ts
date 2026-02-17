import axios, { AxiosRequestConfig } from 'axios';
import { Mechanic, Inquiry, UnreadCount, ApiResponse, QuoteRequest, Review, SyncMessage, SyncStats } from '@/types';

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
      // 401 에러 시 토큰 및 세션 정보 정리
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();

        // 로그인 페이지가 아닌 경우에만 리다이렉트
        const path = window.location.pathname;
        if (path.startsWith('/owner') && !path.includes('/owner/login')) {
          window.location.href = '/owner/login';
        } else if (path.startsWith('/admin') && !path.includes('/admin/login')) {
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
  getProfile: () => api.get('/auth/profile'),
  submitBusinessLicense: (data: { businessLicenseUrl: string; businessName: string }) =>
    api.post('/owner/business-license', data),
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
  reject: (id: number) => api.patch(`/admin/owners/${id}/reject`),
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

export default api;
