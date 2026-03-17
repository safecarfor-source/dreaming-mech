import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ErpAuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: string | null;
  login: (token: string, expiresAt: string) => void;
  logout: () => void;
}

export const useErpAuthStore = create<ErpAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      expiresAt: null,
      login: (token, expiresAt) =>
        set({ isAuthenticated: true, token, expiresAt }),
      logout: () =>
        set({ isAuthenticated: false, token: null, expiresAt: null }),
    }),
    {
      name: 'erp-auth-storage',
    }
  )
);
