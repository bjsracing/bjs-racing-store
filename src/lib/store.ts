// src/lib/store.ts
import { create } from "zustand";
import { supabase } from "./supabaseClient.ts";
import { devtools } from "zustand/middleware";

// ==================================================================
// == DEFINISI TIPE DATA (TYPESCRIPT)                            ==
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
  type: 'success' | 'error' | 'warning' | 'info';
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
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (toastId: string) => void;
  clearToasts: () => void;
}

// ==================================================================
// == IMPLEMENTASI ZUSTAND STORE YANG LENGKAP                     ==
// ==================================================================

export const useAppStore = create<StoreState>()(
  devtools((set, get) => ({
    items: [],
    toasts: [],

    fetchCart: async () => {
      console.log("[DEBUG-STORE] Starting secure fetchCart...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(
          "[DEBUG-STORE] No user found for fetchCart. Clearing items.",
        );
        set({ items: [] });
        return;
      }

      console.log("[DEBUG-STORE] Fetching cart for user ID:", user.id);
      const { data: cartItems, error } = await supabase.rpc("secure_get_cart_items", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("[DEBUG-STORE] Error fetching cart from DB:", error);
        set({ items: [] });
        return;
      }

      console.log("[DEBUG-STORE] Successfully fetched cart items:", cartItems);
      set({ items: cartItems as CartItem[] });
    },

    addToCart: async (productToAdd, quantity) => {
      console.log(
        "[DEBUG-STORE] Starting secure addToCart for product:",
        productToAdd.id,
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[DEBUG-STORE] User not logged in. Aborting addToCart.");
        throw new Error("NOT_AUTHENTICATED");
      }

      try {
        console.log("[DEBUG-STORE] Calling secure_upsert_cart_item with:", {
          user_id: user.id,
          product_id: productToAdd.id,
          quantity,
        });

        // ✅ Use secure RPC function that validates ownership internally
        const { error: upsertError } = await supabase.rpc("secure_upsert_cart_item", {
          p_user_id: user.id,
          p_product_id: productToAdd.id,
          p_quantity: quantity,
        });

        if (upsertError) {
          console.error("[DEBUG-STORE] Secure upsert failed with error:", upsertError);
          // Handle specific error types from the secure function
          if (upsertError.message?.includes('CUSTOMER_PROFILE_MISSING')) {
            throw new Error("CUSTOMER_PROFILE_MISSING");
          }
          if (upsertError.message?.includes('AUTHENTICATION_REQUIRED')) {
            throw new Error("NOT_AUTHENTICATED");
          }
          throw upsertError;
        }

        console.log(
          "[DEBUG-STORE] Secure upsert successful. Now fetching updated cart.",
        );
        await get().fetchCart();
        console.log("[DEBUG-STORE] Successfully fetched updated cart.");
      } catch (error) {
        console.error(
          "[DEBUG-STORE] Caught an error in addToCart logic:",
          error,
        );
        throw error;
      }
    },

    removeFromCart: async (productId: string) => {
      console.log(
        "[DEBUG-STORE] Starting secure removeFromCart for product:",
        productId,
      );
      // ✅ Use secure updateQuantity with quantity 0 to delete item
      await get().updateQuantity(productId, 0);
    },

    updateQuantity: async (productId: string, quantity: number) => {
      console.log(
        "[DEBUG-STORE] Starting secure updateQuantity for product:",
        productId,
        "to quantity:",
        quantity,
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error(
          "[DEBUG-STORE] User not logged in. Aborting updateQuantity.",
        );
        return;
      }

      console.log(
        "[DEBUG-STORE] Calling secure_update_cart_item_quantity for user ID:",
        user.id,
      );

      // ✅ Use secure RPC function that validates ownership internally
      const { error } = await supabase.rpc("secure_update_cart_item_quantity", {
        p_user_id: user.id,
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("[DEBUG-STORE] Secure update failed with error:", error);
        return;
      }

      console.log("[DEBUG-STORE] Secure update successful. Refreshing cart.");
      await get().fetchCart();
    },

    clearCart: async () => {
      console.log("[DEBUG-STORE] Starting secure clearCart.");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[DEBUG-STORE] User not logged in. Aborting clearCart.");
        return;
      }

      console.log(
        "[DEBUG-STORE] Calling secure_clear_cart for user ID:",
        user.id,
      );
      
      // ✅ Use secure RPC function that validates ownership internally
      const { error } = await supabase.rpc("secure_clear_cart", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("[DEBUG-STORE] Secure clear cart failed with error:", error);
        return;
      }

      console.log("[DEBUG-STORE] Secure clear cart successful. Clearing local state.");
      set({ items: [] });
    },

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
