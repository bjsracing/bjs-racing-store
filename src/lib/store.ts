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

interface StoreState {
  items: CartItem[];
  addresses: Address[];
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
}

// ==================================================================
// == IMPLEMENTASI ZUSTAND STORE YANG BARU                         ==
// ==================================================================

export const useAppStore = create<StoreState>()(
  devtools((set, get) => ({
    // --- State Keranjang Belanja ---
    items: [],

    fetchCart: async () => {
      console.log("[DEBUG-STORE] Starting fetchCart...");
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
      const { data: cartItems, error } = await supabase.rpc("get_cart_items", {
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
        "[DEBUG-STORE] Starting addToCart for product:",
        productToAdd.id,
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[DEBUG-STORE] User not logged in. Aborting addToCart.");
        return;
      }

      try {
        console.log(
          "[DEBUG-STORE] Searching for customer ID for auth_user_id:",
          user.id,
        );
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (customerError || !customerData) {
          console.error(
            "[DEBUG-STORE] Error fetching customer ID:",
            customerError,
          );
          throw new Error("Customer ID not found or customer profile missing.");
        }

        const customerId = customerData.id;
        console.log("[DEBUG-STORE] Found customer ID:", customerId);
        console.log("[DEBUG-STORE] Attempting upsert with data:", {
          customer_id: customerId,
          product_id: productToAdd.id,
          quantity,
        });

        const { error: upsertError } = await supabase.from("cart_items").upsert(
          {
            customer_id: customerId,
            product_id: productToAdd.id,
            quantity,
          },
          { onConflict: "customer_id, product_id" },
        );

        if (upsertError) {
          console.error("[DEBUG-STORE] Upsert failed with error:", upsertError);
          throw upsertError;
        }

        console.log(
          "[DEBUG-STORE] Upsert successful. Now fetching updated cart.",
        );
        await get().fetchCart();
        console.log("[DEBUG-STORE] Successfully fetched updated cart.");
      } catch (error) {
        console.error(
          "[DEBUG-STORE] Caught an error in addToCart logic:",
          error,
        );
      }
    },

    removeFromCart: async (productId: string) => {
      console.log(
        "[DEBUG-STORE] Starting removeFromCart for product:",
        productId,
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error(
          "[DEBUG-STORE] User not logged in. Aborting removeFromCart.",
        );
        return;
      }

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error(
          "[DEBUG-STORE] Error fetching customer ID:",
          customerError,
        );
        return;
      }

      const customerId = customerData.id;
      console.log(
        "[DEBUG-STORE] Attempting to delete item for customer ID:",
        customerId,
      );
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("customer_id", customerId)
        .eq("product_id", productId);

      if (error) {
        console.error("[DEBUG-STORE] Delete failed with error:", error);
        return;
      }

      console.log("[DEBUG-STORE] Delete successful. Updating local state.");
      set((state) => ({
        items: state.items.filter((item) => item.id !== productId),
      }));
    },

    updateQuantity: async (productId: string, quantity: number) => {
      console.log(
        "[DEBUG-STORE] Starting updateQuantity for product:",
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

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error(
          "[DEBUG-STORE] Error fetching customer ID:",
          customerError,
        );
        return;
      }

      const customerId = customerData.id;
      console.log(
        "[DEBUG-STORE] Attempting update for customer ID:",
        customerId,
      );
      if (quantity < 1) {
        get().removeFromCart(productId);
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("customer_id", customerId)
        .eq("product_id", productId);

      if (error) {
        console.error("[DEBUG-STORE] Update failed with error:", error);
        return;
      }

      console.log("[DEBUG-STORE] Update successful. Updating local state.");
      set((state) => ({
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      }));
    },

    clearCart: async () => {
      console.log("[DEBUG-STORE] Starting clearCart.");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[DEBUG-STORE] User not logged in. Aborting clearCart.");
        return;
      }

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (customerError || !customerData) {
        console.error(
          "[DEBUG-STORE] Error fetching customer ID:",
          customerError,
        );
        return;
      }

      const customerId = customerData.id;
      console.log(
        "[DEBUG-STORE] Attempting to clear cart for customer ID:",
        customerId,
      );
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("customer_id", customerId);

      if (error) {
        console.error("[DEBUG-STORE] Clear cart failed with error:", error);
        return;
      }

      console.log("[DEBUG-STORE] Clear cart successful. Clearing local state.");
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
  })),
);
