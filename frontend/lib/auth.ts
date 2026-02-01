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

/**
 * Authentication state management using Zustand
 *
 * SECURITY: Auth tokens are now stored in HttpOnly cookies instead of localStorage
 * to prevent XSS attacks. This store only manages admin user info.
 *
 * The auth token is automatically sent with API requests via the 'access_token' cookie.
 */
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
