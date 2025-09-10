// src/lib/store.ts
import { create } from "zustand";
import { supabase } from "./supabaseClient";

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

export const useAppStore = create<StoreState>()((set, get) => ({
  // --- State Keranjang Belanja ---
  items: [],

  fetchCart: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ items: [] });
      return;
    }

    const { data: cartItems, error } = await supabase.rpc("get_cart_items", {
      p_customer_id: user.id,
    });

    if (error) {
      console.error("Error fetching cart from DB:", error);
      set({ items: [] });
      return;
    }

    set({ items: cartItems as CartItem[] });
  },

  addToCart: async (productToAdd: Product, quantity: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not logged in. Cannot add to cart.");
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        customer_id: user.id,
        product_id: productToAdd.id,
        quantity,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to cart:", error);
      return;
    }

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
          items: [...state.items, { ...productToAdd, quantity }],
        };
      }
    });
  },

  removeFromCart: async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not logged in. Cannot remove from cart.");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) {
      console.error("Error removing from cart:", error);
      return;
    }

    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  updateQuantity: async (productId: string, quantity: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not logged in. Cannot update quantity.");
      return;
    }

    if (quantity < 1) {
      get().removeFromCart(productId);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) {
      console.error("Error updating quantity:", error);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    }));
  },

  clearCart: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not logged in. Cannot clear cart.");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("customer_id", user.id);

    if (error) {
      console.error("Error clearing cart:", error);
      return;
    }

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

  // --- State Modul Alamat ---
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
}));
