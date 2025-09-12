// File: src/lib/store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { supabase } from "../lib/supabaseBrowserClient.ts";

// ==================================================================
// == DEFINISI TIPE DATA (TYPESCRIPT)                              ==
// ==================================================================

interface Product {
  id: string;
  nama: string;
  harga_jual: number;
  image_url: string;
  berat_gram: number;
  merek?: string;
  ukuran?: string;
}

// PERBAIKAN KECIL: Menambahkan product_id secara eksplisit untuk kejelasan
// Meskipun sudah ada 'id' dari extends Product, ini membuat logika lebih mudah dibaca
export interface CartItem extends Product {
  quantity: number;
  product_id: string;
}

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
}

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
}

interface StoreState {
  items: CartItem[];
  addresses: Address[];
  isMobileMenuOpen: boolean;
  isCartLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productToAdd: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearLocalCart: () => void;
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
// == IMPLEMENTASI ZUSTAND STORE (DATABASE-DRIVEN)                 ==
// ==================================================================

export const useAppStore = create<StoreState>()(
  devtools((set, get) => ({
    // --- Initial State ---
    items: [],
    addresses: [],
    isMobileMenuOpen: false,
    isCartLoading: true,

    // --- Fungsi Keranjang Belanja (Terhubung ke Supabase) ---
    fetchCart: async () => {
      set({ isCartLoading: true });
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          set({ items: [], isCartLoading: false });
          return;
        }

        const { data, error } = await supabase.rpc("get_cart_items", {
          p_user_id: user.id,
        });

        if (error) {
          console.error("Gagal mengambil data keranjang:", error);
          set({ items: [] });
        } else {
          set({ items: (data as any[]) || [] });
        }
      } catch (e) {
        console.error("Terjadi pengecualian saat fetchCart:", e);
        set({ items: [] });
      } finally {
        set({ isCartLoading: false });
      }
    },

    addToCart: async (productToAdd, quantity) => {
      // Optimistic UI Update
      set((state) => {
        // --- PERBAIKAN: Gunakan productToAdd.id untuk mencari produk yang ada ---
        const existingItem = state.items.find(
          (item) => item.product_id === productToAdd.id,
        );
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              // --- PERBAIKAN: Gunakan product_id untuk perbandingan ---
              item.product_id === productToAdd.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          };
        }
        // Saat menambahkan item baru, pastikan product_id juga disertakan
        return {
          items: [
            ...state.items,
            {
              ...productToAdd,
              quantity: quantity,
              product_id: productToAdd.id,
            },
          ],
        };
      });

      // Sinkronisasi dengan Database
      const { error } = await supabase.rpc("upsert_cart_item", {
        p_product_id: productToAdd.id,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Gagal sinkronisasi addToCart:", error);
        get().fetchCart();
      }
    },

    updateQuantity: async (productId, quantity) => {
      if (quantity < 1) {
        return get().removeFromCart(productId);
      }
      set((state) => ({
        items: state.items.map((item) =>
          // --- PERBAIKAN UTAMA: Bandingkan dengan 'product_id' bukan 'id' ---
          item.product_id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        ),
      }));

      const { error } = await supabase.rpc("update_cart_item_quantity", {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Gagal sinkronisasi updateQuantity:", error);
        get().fetchCart();
      }
    },

    removeFromCart: async (productId) => {
      set((state) => ({
        // --- PERBAIKAN UTAMA: Bandingkan dengan 'product_id' bukan 'id' ---
        items: state.items.filter((item) => item.product_id !== productId),
      }));

      const { error } = await supabase.rpc("update_cart_item_quantity", {
        p_product_id: productId,
        p_quantity: 0,
      });

      if (error) {
        console.error("Gagal sinkronisasi removeFromCart:", error);
        get().fetchCart();
      }
    },

    clearCart: async () => {
      set({ items: [] });
      const { error } = await supabase.rpc("clear_cart");
      if (error) {
        console.error("Gagal sinkronisasi clearCart:", error);
        get().fetchCart();
      }
    },

    clearLocalCart: () => {
      set({ items: [], isCartLoading: false });
    },

    calculateTotalWeight: () => {
      return get().items.reduce(
        (total, item) => total + (item.berat_gram || 0) * item.quantity,
        0,
      );
    },

    // --- State Menu Mobile ---
    toggleMobileMenu: () =>
      set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),

    // --- State Modul Alamat ---
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
    addAddress: async (addressData) => {
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
    updateAddress: async (addressId, addressData) => {
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
    deleteAddress: async (addressId) => {
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
  })),
);
