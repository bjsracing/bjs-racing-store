// File: src/lib/store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { supabase } from "../lib/supabaseBrowserClient.ts";
import type { Session } from "@supabase/supabase-js";

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
  sku?: string;
  stok?: number; // PERBAIKAN 1: Tambahkan 'stok' sebagai properti opsional di Product
}

export interface CartItem extends Product {
  quantity: number;
  product_id: string;
  stok: number; // PERBAIKAN 2: Pastikan 'stok' wajib ada di CartItem
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
  session: Session | null;
  setSession: (session: Session | null) => void;
  items: CartItem[];
  addresses: Address[];
  isMobileMenuOpen: boolean;
  isCartLoading: boolean;
  toasts: Toast[];
  signOut: () => Promise<void>;

  fetchCart: () => Promise<void>;
  addToCart: (productToAdd: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearLocalCart: () => void;
  calculateTotalWeight: () => number;

  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (toastId: string) => void;

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
    session: null,
    items: [],
    addresses: [],
    isMobileMenuOpen: false,
    isCartLoading: true,
    toasts: [],

    setSession: (session) => set({ session }),

    // tambahkan implementasi fungsi signOut:
    signOut: async () => {
      const { clearLocalCart, addToast } = get();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        addToast({
          type: "error",
          message: "Gagal keluar, silakan coba lagi.",
        });
      } else {
        clearLocalCart(); // Bersihkan state keranjang di frontend
        addToast({ type: "success", message: "Anda berhasil keluar." });
        // Arahkan ke halaman utama setelah 1 detik
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    },

    // Di dalam file: /src/lib/store.ts

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
          const fetchedItems = (data as CartItem[]) || [];
          let wasCartAdjusted = false;

          // --- LOGIKA BARU DIMULAI DI SINI ---
          // 1. Validasi dan sesuaikan kuantitas setiap item
          const adjustedItems = fetchedItems
            .map((item) => {
              if (item.quantity > item.stok) {
                wasCartAdjusted = true;
                // Jika kuantitas di keranjang > stok, pangkas ke jumlah stok
                return { ...item, quantity: item.stok };
              }
              return item;
              // 2. Hapus item yang stoknya sudah 0
            })
            .filter((item) => item.stok > 0 && item.quantity > 0);

          set({ items: adjustedItems });
          // --- AKHIR DARI LOGIKA BARU ---

          // 3. Beri notifikasi ke pengguna jika keranjangnya disesuaikan
          if (wasCartAdjusted) {
            get().addToast({
              type: "warning",
              message:
                "Beberapa item di keranjang Anda disesuaikan karena perubahan stok.",
            });
          }
        }
      } catch (e) {
        console.error("Terjadi pengecualian saat fetchCart:", e);
        set({ items: [] });
      } finally {
        set({ isCartLoading: false });
      }
    },

    addToCart: async (productToAdd, quantity) => {
      const { items, addToast, fetchCart } = get();

      // Cek dulu apakah pengguna sudah login dan profilnya lengkap
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("NOT_AUTHENTICATED");
      }
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("auth_user_id", user.id);
      if (count === 0) {
        throw new Error("CUSTOMER_PROFILE_MISSING");
      }

      const existingItem = items.find(
        (item) => item.product_id === productToAdd.id,
      );
      const newQuantity = (existingItem?.quantity || 0) + quantity;
      const availableStock = productToAdd.stok ?? 0;

      // Validasi stok
      if (newQuantity > availableStock) {
        addToast({
          type: "warning",
          message: `Stok ${productToAdd.nama} tidak mencukupi (sisa ${availableStock}).`,
        });
        return; // Hentikan proses
      }

      // Optimistic UI Update (Memperbarui tampilan di browser secara instan)
      set((state) => {
        if (existingItem) {
          // Jika item sudah ada, perbarui kuantitasnya
          return {
            items: state.items.map((item) =>
              item.product_id === productToAdd.id
                ? { ...item, quantity: newQuantity }
                : item,
            ),
          };
        }
        // Jika item baru, tambahkan ke dalam array items
        return {
          items: [
            ...state.items,
            {
              ...productToAdd,
              quantity: newQuantity, // Gunakan newQuantity
              product_id: productToAdd.id,
              stok: availableStock,
            },
          ],
        };
      });

      // Sinkronisasi dengan Database di latar belakang
      const { error } = await supabase.rpc("upsert_cart_item", {
        p_product_id: productToAdd.id,
        p_quantity: quantity, // Kirim hanya kuantitas yang ditambahkan
      });

      if (error) {
        console.error("Gagal sinkronisasi addToCart:", error);
        addToast({ type: "error", message: "Gagal memperbarui keranjang." });
        fetchCart(); // Jika gagal, kembalikan state sesuai data di DB
      } else {
        addToast({
          type: "success",
          message: `${quantity}x ${productToAdd.nama} ditambahkan.`,
        });
      }
    },

    updateQuantity: async (productId, quantity) => {
      const { items, addToast, fetchCart, removeFromCart } = get();
      if (quantity < 1) {
        return removeFromCart(productId);
      }

      const itemToUpdate = items.find((item) => item.product_id === productId);
      if (!itemToUpdate) return;

      // Logika Validasi Stok Utama
      if (quantity > itemToUpdate.stok) {
        addToast({
          type: "warning",
          message: `Stok tidak mencukupi. Sisa ${itemToUpdate.stok}.`,
        });
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? { ...item, quantity: itemToUpdate.stok }
              : item,
          ),
        }));
        await supabase.rpc("update_cart_item_quantity", {
          p_product_id: productId,
          p_quantity: itemToUpdate.stok,
        });
        return;
      }

      set((state) => ({
        items: state.items.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item,
        ),
      }));

      const { error } = await supabase.rpc("update_cart_item_quantity", {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error("Gagal sinkronisasi updateQuantity:", error);
        fetchCart();
      }
    },

    removeFromCart: async (productId) => {
      set((state) => ({
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
    toggleMobileMenu: () =>
      set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),

    addToast: (toast) => {
      const id =
        Date.now().toString() + Math.random().toString(36).slice(2, 11); // PERBAIKAN 4: Ganti .substr() dengan .slice()
      set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    },
    removeToast: (toastId) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }));
    },

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
