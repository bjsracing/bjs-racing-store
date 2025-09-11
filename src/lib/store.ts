// src/lib/store.ts
import { create } from "zustand";
import { supabase } from "./supabaseClient.ts";
import { devtools } from "zustand/middleware";

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

export interface CartItem extends Product {
  quantity: number;
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

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface StoreState {
  items: CartItem[];
  addresses: Address[];
  toasts: Toast[];
  isMobileMenuOpen: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productToAdd: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
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
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (toastId: string) => void;
  clearToasts: () => void;
}

// ==================================================================
// == IMPLEMENTASI ZUSTAND STORE YANG LENGKAP                      ==
// ==================================================================

export const useAppStore = create<StoreState>()(
  devtools((set, get) => ({
    items: [],
    toasts: [],

    // --- REFAKTOR DIMULAI ---
    fetchCart: async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          set({ items: [] });
          return;
        }

        const { data, error } = await supabase.rpc("get_cart_items", {
          p_user_id: user.id,
        });

        if (error) {
          console.error("[STORE] Error fetching cart:", error);
          set({ items: [] });
          return;
        }

        set({ items: data as CartItem[] });
      } catch (error) {
        console.error("[STORE] Exception in fetchCart:", error);
        set({ items: [] });
      }
    },

    addToCart: async (productToAdd, quantity) => {
      const { fetchCart } = get();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("NOT_AUTHENTICATED");

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error("[STORE] Customer lookup failed:", customerError);
        throw new Error("CUSTOMER_PROFILE_MISSING");
      }

      const { error: rpcError } = await supabase.rpc("upsert_cart_item", {
        p_customer_id: customerData.id,
        p_product_id: productToAdd.id,
        p_quantity: quantity,
      });

      if (rpcError) {
        console.error("[STORE] Error calling upsert_cart_item:", rpcError);
        throw rpcError;
      }

      await fetchCart();
    },

    removeFromCart: async (productId: string) => {
      // Menghapus item sama dengan mengupdate kuantitasnya menjadi 0
      await get().updateQuantity(productId, 0);
    },

    updateQuantity: async (productId: string, quantity: number) => {
      const { fetchCart } = get();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error("[STORE] Customer lookup failed:", customerError);
        return;
      }

      // Asumsi ada fungsi `update_cart_item_quantity` di DB.
      // Jika tidak ada, fungsi ini perlu dibuat atau disesuaikan.
      const { error: rpcError } = await supabase.rpc(
        "update_cart_item_quantity",
        {
          p_customer_id: customerData.id,
          p_product_id: productId,
          p_quantity: quantity,
        },
      );

      if (rpcError) {
        console.error("[STORE] Error updating quantity:", rpcError);
        return;
      }

      await fetchCart();
    },

    clearCart: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error("[STORE] Customer lookup failed:", customerError);
        return;
      }

      // Asumsi ada fungsi `clear_cart` di DB.
      const { error: rpcError } = await supabase.rpc("clear_cart", {
        p_customer_id: customerData.id,
      });

      if (rpcError) {
        console.error("[STORE] Error clearing cart:", rpcError);
        return;
      }

      set({ items: [] });
    },
    // --- REFAKTOR SELESAI ---

    calculateTotalWeight: () => {
      const items = get().items;
      return items.reduce((totalWeight, item) => {
        const weightPerItem = item.berat_gram || 0;
        return totalWeight + weightPerItem * item.quantity;
      }, 0);
    },

    isMobileMenuOpen: false,
    toggleMobileMenu: () =>
      set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),

    addresses: [],
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

    // Toast notification actions
    addToast: (toastData) => {
      const toast: Toast = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...toastData,
      };
      set((state) => ({
        toasts: [...state.toasts, toast],
      }));
    },

    removeToast: (toastId) => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      }));
    },

    clearToasts: () => {
      set({ toasts: [] });
    },
  })),
);
