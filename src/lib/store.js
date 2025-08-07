// src/lib/store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      // State untuk keranjang (tetap sama)
      items: [],
      addToCart: (productToAdd, quantity) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === productToAdd.id,
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === productToAdd.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          } else {
            return {
              items: [...state.items, { ...productToAdd, quantity: quantity }],
            };
          }
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),

      // --- STATE BARU UNTUK MENU MOBILE ---
      isMobileMenuOpen: false,
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    }),
    {
      name: "bjs-racing-store-cart",
      // Hanya simpan keranjang di localStorage, tidak status menu
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
