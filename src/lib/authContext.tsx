// File: src/lib/authContext.tsx
// Perbaikan Final: Mengubah .then() menjadi async/await di dalam useEffect
// untuk memastikan tipe data session terbaca dengan benar oleh TypeScript.

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "./supabaseClient.js";
import { useAppStore } from "./store.ts";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

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
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    console.log(
      "[DEBUG AuthContext] Memulai pengecekan sesi dan memasang listener...",
    );

    // --- PERBAIKAN UTAMA DI SINI ---
    // Menggunakan fungsi async untuk menangani pengecekan sesi awal.
    // Ini lebih mudah dibaca dan memberikan type inference yang lebih baik.
    const checkInitialSession = async () => {
      // getSession() mengembalikan { data: { session }, error }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false); // Pengecekan awal selesai, loading dihentikan

      if (session) {
        console.log(
          "[DEBUG AuthContext] Sesi awal ditemukan. Mengambil data keranjang...",
        );
        fetchCart();
      } else {
        console.log("[DEBUG AuthContext] Tidak ada sesi awal yang ditemukan.");
      }
    };

    checkInitialSession();
    // --- AKHIR PERBAIKAN ---

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
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
        }
      },
    );

    return () => {
      console.log("[DEBUG AuthContext] Membersihkan listener autentikasi.");
      subscription.unsubscribe();
    };
  }, [fetchCart, supabase]);

  const value = { session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Membuat "custom hook"
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
