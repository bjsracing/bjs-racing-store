// File: src/lib/authContext.tsx
// Perbaikan: Menggunakan 'type-only import' untuk ReactNode.

// --- PERBAIKAN DI BARIS INI ---
// Tambahkan kata kunci 'type' sebelum ReactNode
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient.js";
import { useAppStore } from "./store.ts";
import type { Session } from "@supabase/supabase-js";

// 1. Mendefinisikan "bentuk" data yang akan dibagikan oleh context
interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

// 2. Membuat React Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Membuat komponen "Provider"
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCart = useAppStore((state) => state.fetchCart);

  useEffect(() => {
    console.log(
      "[DEBUG AuthContext] Memulai pengecekan sesi dan memasang listener...",
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);

      if (session) {
        console.log(
          "[DEBUG AuthContext] Sesi awal ditemukan. Mengambil data keranjang...",
        );
        fetchCart();
      } else {
        console.log("[DEBUG AuthContext] Tidak ada sesi awal yang ditemukan.");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        `[DEBUG AuthContext] Status autentikasi berubah. Event: ${_event}`,
      );
      setSession(session);

      if (_event === "SIGNED_IN") {
        console.log(
          "[DEBUG AuthContext] Pengguna berhasil SIGNED_IN. Mengambil data keranjang...",
        );
        fetchCart();
      }

      if (_event === "SIGNED_OUT") {
        console.log("[DEBUG AuthContext] Pengguna berhasil SIGNED_OUT.");
        // State keranjang akan otomatis kosong saat di-fetch ulang pada login berikutnya.
      }
    });

    return () => {
      console.log("[DEBUG AuthContext] Membersihkan listener autentikasi.");
      subscription.unsubscribe();
    };
  }, [fetchCart]);

  const value = { session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Membuat "custom hook" untuk mempermudah akses data
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
