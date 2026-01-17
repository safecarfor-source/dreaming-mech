import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) =>
        set({ token, admin, isAuthenticated: true }),
      logout: () =>
        set({ token: null, admin: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// API 호출 시 인증 헤더 추가
export const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
