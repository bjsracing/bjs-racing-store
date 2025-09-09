// File: src/lib/authContext.tsx
// Perbaikan: Menggunakan getSupabaseBrowserClient() untuk mendapatkan client.

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
// PERBAIKAN 1: Impor FUNGSI, bukan konstanta
import { getSupabaseBrowserClient } from "./supabaseClient.js";
import { useAppStore } from "./store.ts";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCart = useAppStore((state) => state.fetchCart);

  // PERBAIKAN 2: Panggil fungsi untuk mendapatkan client Supabase di dalam komponen
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      if (session) {
        fetchCart();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === "SIGNED_IN") {
        fetchCart();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCart, supabase]); // Tambahkan supabase sebagai dependensi

  const value = { session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
