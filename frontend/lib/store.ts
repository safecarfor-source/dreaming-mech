import { create } from 'zustand';
import type { Mechanic } from '@/types';

interface ModalStore {
  isOpen: boolean;
  mechanic: Mechanic | null;
  open: (mechanic: Mechanic) => void;
  close: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  mechanic: null,
  open: (mechanic) => set({ isOpen: true, mechanic }),
  close: () => set({ isOpen: false, mechanic: null }),
}));
