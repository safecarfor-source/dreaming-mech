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

// ── 사장님(Owner) 인증 상태 ──

interface OwnerInfo {
  id: number;
  email?: string;
  name?: string;
  profileImage?: string;
  provider: string;
  status: string;
  rejectionReason?: string;
  businessLicenseUrl?: string;
  businessName?: string;
}

interface OwnerAuthState {
  owner: OwnerInfo | null;
  isAuthenticated: boolean;
  login: (owner: OwnerInfo) => void;
  logout: () => void;
}

export const useOwnerStore = create<OwnerAuthState>()(
  persist(
    (set) => ({
      owner: null,
      isAuthenticated: false,
      login: (owner) =>
        set({ owner, isAuthenticated: true }),
      logout: () =>
        set({ owner: null, isAuthenticated: false }),
    }),
    {
      name: 'owner-auth-storage',
    }
  )
);
