// lib/stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CourseSummary } from '@/types/api';

interface CartState {
  items: CartItem[];
  addItem: (course: CourseSummary) => void;
  removeItem: (courseId: number) => void;
  clearCart: () => void;
  hasItem: (courseId: number) => boolean;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (course) => {
        if (get().hasItem(course.id)) return;
        set((s) => ({
          items: [...s.items, { course, price: course.effective_price }],
        }));
      },

      removeItem: (courseId) =>
        set((s) => ({ items: s.items.filter((i) => i.course.id !== courseId) })),

      clearCart: () => set({ items: [] }),

      hasItem: (courseId) => get().items.some((i) => i.course.id === courseId),

      total: () => get().items.reduce((sum, i) => sum + i.price, 0),

      count: () => get().items.length,
    }),
    {
      name: 'learnhub-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
