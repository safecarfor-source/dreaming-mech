import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      login: (admin) =>
        set({ admin, isAuthenticated: true }),
      logout: () =>
        set({ admin: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// ── 통합 유저 인증 상태 ──

export interface UserInfo {
  id: number;
  email?: string;
  nickname?: string;
  profileImage?: string;
  phone?: string;
  businessStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';
  businessLicenseUrl?: string;
  businessName?: string;
  address?: string;
  rejectionReason?: string;
  signupInquiryId?: number;
  provider?: string;
  name?: string;
}

interface UserAuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (user: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'user-auth-storage' }
  )
);
