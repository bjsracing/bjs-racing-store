// File: src/lib/store.ts
// Versi lengkap dan utuh dengan state management untuk keranjang dan alamat,
// serta Tipe Data yang diperbarui untuk mendukung data koordinat peta.

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================================================================
// == DEFINISI TIPE DATA (TYPESCRIPT)                            ==
// ==================================================================

// Tipe data untuk objek produk
interface Product {
  id: string;
  nama: string;
  harga_jual: number;
  image_url: string;
  berat_gram: number;
  merek?: string;
  ukuran?: string;
}

// Tipe data untuk item di dalam keranjang belanja
interface CartItem extends Product {
  quantity: number;
}

// Tipe data untuk objek Alamat lengkap yang disimpan di state
export interface Address {
  id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  destination: string;
  destination_text: string;
  postal_code: string;
  is_primary: boolean;
  province_id?: string;
  city_id?: string;
  latitude?: number; // Ditambahkan untuk pin point peta
  longitude?: number; // Ditambahkan untuk pin point peta
}

// Tipe data untuk state internal form di AddressForm.tsx
export interface FormDataState {
  label: string;
  recipient_name: string;
  recipient_phone: string;
  destination: string;
  destination_text: string;
  full_address: string;
  postal_code: string;
  province_id?: string;
  city_id?: string;
  latitude?: number; // Ditambahkan untuk pin point peta
  longitude?: number; // Ditambahkan untuk pin point peta
}

// Tipe data untuk keseluruhan state Zustand store
interface StoreState {
  items: CartItem[];
  addresses: Address[];
  isMobileMenuOpen: boolean;
  addToCart: (productToAdd: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotalWeight: () => number;
  fetchAddresses: () => Promise<void>;
  addAddress: (addressData: FormDataState) => Promise<void>;
  updateAddress: (
    addressId: string,
    addressData: FormDataState,
  ) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

// ==================================================================
// == IMPLEMENTASI ZUSTAND STORE                                   ==
// ==================================================================

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // --- State Keranjang Belanja ---
      items: [],
      addToCart: (productToAdd: Product, quantity: number) =>
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
      removeFromCart: (productId: string) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      updateQuantity: (productId: string, quantity: number) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
      calculateTotalWeight: () => {
        const items = get().items;
        return items.reduce((totalWeight, item) => {
          const weightPerItem = item.berat_gram || 0;
          return totalWeight + weightPerItem * item.quantity;
        }, 0);
      },

      // --- State Menu Mobile ---
      isMobileMenuOpen: false,
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),

      // --- State Modul Alamat ---
      addresses: [],
      fetchAddresses: async () => {
        try {
          const response = await fetch(
            `/api/addresses?timestamp=${Date.now()}`,
          );
          if (!response.ok) throw new Error("Gagal mengambil data alamat.");
          const data = await response.json();
          set({ addresses: data });
        } catch (error) {
          console.error("Error fetching addresses:", error);
          set({ addresses: [] });
        }
      },
      addAddress: async (addressData: FormDataState) => {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressData),
        });
        const newAddress = await response.json();
        if (!response.ok)
          throw new Error(newAddress.message || "Gagal menyimpan alamat baru.");
        set((state) => ({ addresses: [newAddress, ...state.addresses] }));
      },
      updateAddress: async (addressId: string, addressData: FormDataState) => {
        const response = await fetch("/api/addresses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: addressId, ...addressData }),
        });
        const updatedAddress = await response.json();
        if (!response.ok)
          throw new Error(
            updatedAddress.message || "Gagal memperbarui alamat.",
          );
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === addressId ? updatedAddress : addr,
          ),
        }));
      },
      deleteAddress: async (addressId: string) => {
        const response = await fetch("/api/addresses", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addressId: addressId }),
        });
        if (!response.ok) throw new Error("Gagal menghapus alamat di server.");
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== addressId),
        }));
      },
    }),
    {
      name: "bjs-racing-store-cart",
      // Hanya menyimpan keranjang di localStorage untuk persistensi antar sesi.
      // Alamat akan selalu diambil dari server untuk memastikan data segar.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
