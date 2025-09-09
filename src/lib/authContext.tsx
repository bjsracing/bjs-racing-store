// File: src/lib/authContext.tsx
// Deskripsi: Pusat kontrol (React Context) untuk mengelola sesi autentikasi pengguna
// di seluruh aplikasi secara terpusat dan reaktif.

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import { useAppStore } from "./store.ts";
import type {
  Session,
  AuthChangeEvent,
  SupabaseClient,
} from "@supabase/supabase-js";

// 1. Mendefinisikan "bentuk" data yang akan dibagikan oleh context
interface AuthContextType {
  supabase: SupabaseClient | null;
  session: Session | null;
  isLoading: boolean;
}

// 2. Membuat React Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Membuat komponen "Provider"
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCart = useAppStore((state) => state.fetchCart);

  useEffect(() => {
    // Fungsi ini HANYA akan berjalan di browser.
    const initializeSupabase = async () => {
      console.log(
        "[DEBUG AuthContext] Berjalan di browser. Mengimpor createBrowserClient...",
      );
      const { createBrowserClient } = await import("@supabase/ssr");

      const supabaseClient = createBrowserClient(
        import.meta.env.PUBLIC_SUPABASE_URL!,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
      );

      setSupabase(supabaseClient);

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      setSession(session);
      setIsLoading(false);

      if (session) {
        console.log(
          "[DEBUG AuthContext] Sesi awal ditemukan. Mengambil keranjang...",
        );
        fetchCart();
      }

      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setSession(session);
          if (_event === "SIGNED_IN") {
            fetchCart();
          }
        },
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    if (typeof window !== "undefined") {
      initializeSupabase();
    }
  }, [fetchCart]);

  const value = { supabase, session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Membuat "custom hook" untuk mempermudah akses
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
