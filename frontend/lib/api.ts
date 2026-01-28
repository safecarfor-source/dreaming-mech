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

// Analytics API
export const analyticsApi = {
  trackPageView: (path: string, referer?: string) =>
    api.post('/analytics/pageview', { path, referer }),
  getSiteStats: (days?: number, token?: string) => {
    const config: any = { params: {} };
    if (days !== undefined) {
      config.params.days = days;
    }
    if (token) {
      config.headers = {
        ...api.defaults.headers.common,
        Authorization: `Bearer ${token}`,
      };
    }
    return api.get('/analytics/site-stats', config);
  },
  getMechanicMonthlyClicks: (id: number, months: number = 6, token?: string) => {
    const config: any = { params: { months } };
    if (token) {
      config.headers = {
        ...api.defaults.headers.common,
        Authorization: `Bearer ${token}`,
      };
    }
    return api.get(`/analytics/mechanic/${id}/monthly`, config);
  },
  getAllMechanicsMonthlyClicks: (months: number = 6, token?: string) => {
    const config: any = { params: { months } };
    if (token) {
      config.headers = {
        ...api.defaults.headers.common,
        Authorization: `Bearer ${token}`,
      };
    }
    return api.get('/analytics/all-mechanics-monthly', config);
  },
  getTopMechanics: (
    period: 'realtime' | 'daily' | 'monthly' = 'realtime',
    options?: {
      limit?: number;
      days?: number;
      months?: number;
      token?: string;
    },
  ) => {
    const config: any = {
      params: {
        period,
        ...(options?.limit && { limit: options.limit }),
        ...(options?.days && { days: options.days }),
        ...(options?.months && { months: options.months }),
      },
    };

    if (options?.token) {
      config.headers = {
        ...api.defaults.headers.common,
        Authorization: `Bearer ${options.token}`,
      };
    }

    return api.get('/analytics/top-mechanics', config);
  },
};

export default api;
