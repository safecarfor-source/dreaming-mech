import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, CustomerAuthState } from '@/types';

export const useCustomerStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      isLoading: false,
      login: (customer: Customer) => set({ customer, isLoading: false }),
      logout: () => set({ customer: null, isLoading: false }),
    }),
    {
      name: 'customer-auth',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
