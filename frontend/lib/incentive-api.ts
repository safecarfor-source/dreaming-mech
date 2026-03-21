import axios from 'axios';
import { useIncentiveAuthStore } from './incentive-auth';

const incentiveApi = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL ?? '') + '/incentive',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: incentive-auth 스토어에서 토큰을 꺼내 Authorization 헤더 추가
incentiveApi.interceptors.request.use((config) => {
  const token = useIncentiveAuthStore.getState().token;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 발생 시 자동 로그아웃
incentiveApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useIncentiveAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default incentiveApi;
