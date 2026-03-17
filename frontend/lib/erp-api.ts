import axios from 'axios';
import { useErpAuthStore } from './erp-auth';

const erpAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: Bearer 토큰 자동 첨부
erpAxios.interceptors.request.use((config) => {
  const token = useErpAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 401 시 로그아웃 + 로그인 페이지로 리다이렉트
erpAxios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useErpAuthStore.getState().logout();
      window.location.href = '/erp/login';
    }
    return Promise.reject(error);
  }
);

export const erpApi = {
  login: (pin: string) => erpAxios.post('/erp/auth/login', { pin }),
  verify: () => erpAxios.get('/erp/auth/verify'),
  getDashboard: () => erpAxios.get('/erp/dashboard'),
  getDailySales: (params?: { from?: string; to?: string }) =>
    erpAxios.get('/erp/sales/daily', { params }),
  getSalesByCategory: (params?: { from?: string; to?: string }) =>
    erpAxios.get('/erp/sales/category', { params }),
  searchCustomers: (params?: { q?: string; page?: number; limit?: number }) =>
    erpAxios.get('/erp/customers', { params }),
  getCustomerDetail: (code: string) =>
    erpAxios.get(`/erp/customers/${code}/detail`),
  predictNextVisit: (code: string) =>
    erpAxios.get(`/erp/customers/${code}/predict`),
  getReminders: (params?: { status?: string; page?: number; limit?: number }) =>
    erpAxios.get('/erp/reminders', { params }),
  generateReminders: () => erpAxios.post('/erp/reminders/generate'),
  getTopProducts: (params?: { from?: string; to?: string; limit?: number }) =>
    erpAxios.get('/erp/products/top', { params }),

  // CREATE operations
  createVehicle: (data: {
    plateNumber: string;
    ownerName: string;
    phone?: string;
    carModel?: string;
    modelYear?: string;
    color?: string;
    displacement?: string;
    memo?: string;
  }) => erpAxios.post('/erp/customers', data),

  createSale: (data: {
    saleDate: string;
    customerCode: string;
    productCode: string;
    productName?: string;
    qty: number;
    unitPrice: number;
    amount: number;
    saleType?: '1' | '2' | '3';
    memo?: string;
  }) => erpAxios.post('/erp/sales', data),

  createRepair: (data: {
    vehicleCode: string;
    repairDate: string;
    productCode?: string;
    productName: string;
    qty?: number;
    unitPrice?: number;
    amount: number;
    mileage?: number;
    memo?: string;
  }) => erpAxios.post('/erp/repairs', data),

  searchProducts: (q: string) => erpAxios.get('/erp/products/search', { params: { q } }),

  getSyncStatus: () => erpAxios.get('/erp/sync-status'),
};
