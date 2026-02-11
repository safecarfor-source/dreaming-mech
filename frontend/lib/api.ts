import axios, { AxiosRequestConfig } from 'axios';
import { Mechanic, ApiResponse } from '@/types';

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

export default api;
