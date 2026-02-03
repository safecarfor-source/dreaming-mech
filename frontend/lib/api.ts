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
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ✅ 타입 안전한 config 빌더 함수
interface RequestConfig {
  params?: Record<string, any>;
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
  getAll: () => api.get<ApiResponse<Mechanic[]>>('/mechanics'),
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

// Analytics API
// Note: Authentication is now handled automatically via HttpOnly cookies
export const analyticsApi = {
  trackPageView: (path: string, referer?: string) =>
    api.post('/analytics/pageview', { path, referer }),
  getSiteStats: (days?: number) =>
    api.get('/analytics/site-stats', buildConfig({
      params: days !== undefined ? { days } : {}
    })),
  getMechanicMonthlyClicks: (id: number, months: number = 6) =>
    api.get(`/analytics/mechanic/${id}/monthly`, buildConfig({
      params: { months }
    })),
  getAllMechanicsMonthlyClicks: (months: number = 6) =>
    api.get('/analytics/all-mechanics-monthly', buildConfig({
      params: { months }
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

export default api;
