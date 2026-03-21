import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IncentiveUser } from '@/types/incentive';

interface IncentiveAuthState {
  token: string | null;
  user: IncentiveUser | null;
  isAuthenticated: boolean;
  expiresAt: string | null;
  login: (token: string, user: IncentiveUser, expiresAt?: string) => void;
  logout: () => void;
  isExpired: () => boolean;
}

export const useIncentiveAuthStore = create<IncentiveAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      expiresAt: null,

      login: (token, user, expiresAt) =>
        set({ token, user, isAuthenticated: true, expiresAt: expiresAt ?? null }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false, expiresAt: null }),

      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
      },
    }),
    {
      name: 'incentive-auth',
    }
  )
);
