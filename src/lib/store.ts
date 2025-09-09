// File: src/lib/store.ts
// Versi final yang bersih, tanpa duplikasi kode, dan dengan penanganan tipe data yang benar.

import { create } from "zustand";

// ==================================================================
// == DEFINISI TIPE DATA (TYPESCRIPT)                            ==
// ==================================================================

// Tipe data untuk objek produk (diasumsikan dari komponen lain)
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
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
}

// Tipe data untuk keseluruhan state Zustand store
interface StoreState {
  items: CartItem[];
  addresses: Address[];
  isMobileMenuOpen: boolean;
  isLoadingCart: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productToAdd: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
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

export const useAppStore = create<StoreState>()((set, get) => ({
  // --- State Awal ---
  items: [],
  addresses: [],
  isMobileMenuOpen: false,
  isLoadingCart: true,

  // --- Aksi Keranjang (Terhubung ke API) ---
  fetchCart: async () => {
    set({ isLoadingCart: true });
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Gagal mengambil data keranjang.");
      const cartItems = await response.json();
      set({ items: cartItems, isLoadingCart: false });
    } catch (error) {
      let errorMessage = "Fetch cart failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(errorMessage);
      set({ items: [], isLoadingCart: false });
    }
  },

  addToCart: async (productToAdd: Product, quantity: number) => {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productToAdd.id, quantity: quantity }),
    });
    await get().fetchCart();
  },

  removeFromCart: async (productId: string) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    await get().fetchCart();
  },

  updateQuantity: async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await get().removeFromCart(productId);
      return;
    }
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity: quantity }),
    });
    await get().fetchCart();
  },

  calculateTotalWeight: () => {
    const items = get().items;
    return items.reduce((totalWeight, item) => {
      const weightPerItem = item.berat_gram || 0;
      return totalWeight + weightPerItem * item.quantity;
    }, 0);
  },

  // --- Aksi Menu Mobile ---
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  // --- Aksi Modul Alamat ---
  fetchAddresses: async () => {
    try {
      const response = await fetch(`/api/addresses?timestamp=${Date.now()}`);
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
      throw new Error(updatedAddress.message || "Gagal memperbarui alamat.");
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
}));
