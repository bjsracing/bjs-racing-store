// src/lib/cartStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

// 'persist' akan menyimpan data keranjang di localStorage browser
// sehingga tidak hilang saat halaman di-refresh.
export const useCartStore = create(
  persist(
    (set) => ({
      items: [], // Daftar item di keranjang

      // Aksi untuk menambah item ke keranjang dengan jumlah tertentu
      addToCart: (productToAdd, quantity) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === productToAdd.id,
          );
          if (existingItem) {
            // Jika item sudah ada, tambahkan kuantitas yang baru ke yang lama
            return {
              items: state.items.map((item) =>
                item.id === productToAdd.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          } else {
            // Jika item baru, tambahkan ke keranjang dengan kuantitas yang ditentukan
            return {
              items: [...state.items, { ...productToAdd, quantity: quantity }],
            };
          }
        }),

      // Aksi lain (akan kita gunakan nanti)
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
    }),
    {
      name: "bjs-racing-store-cart", // nama unik untuk penyimpanan di localStorage
    },
  ),
);
