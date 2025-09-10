// File: src/lib/authContext.tsx (Diperbaiki & Dioptimalkan untuk SSR)
// Deskripsi: Mengelola sesi autentikasi dengan menerima sesi awal dari server
// untuk menghilangkan "flicker" dan meningkatkan performa.

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";
import { useAppStore } from "./store"; // Asumsi path ini benar
import type {
  Session,
  AuthChangeEvent,
  SupabaseClient,
} from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// 1. Definisikan tipe data yang akan dibagikan (tetap sama)
interface AuthContextType {
  supabase: SupabaseClient; // Supabase client sekarang tidak akan pernah null di sisi klien
  session: Session | null;
}

// 2. Definisikan tipe untuk props Provider
// Kita tambahkan 'initialSession' yang akan kita dapatkan dari server
interface AuthProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

// 3. Buat React Context
// Kita bisa beri nilai default yang lebih informatif untuk debugging
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Buat komponen "Provider" yang sudah dioptimalkan
export const AuthProvider = ({
  children,
  initialSession,
}: AuthProviderProps) => {
  // Inisialisasi Supabase client hanya sekali dan langsung disimpan di state.
  // Ini aman karena AuthProvider hanya akan dirender di client-side "island".
  const [supabase] = useState(() =>
    createBrowserClient(
      import.meta.env.PUBLIC_SUPABASE_URL!,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  // Inisialisasi state 'session' dengan data yang dikirim dari server!
  const [session, setSession] = useState<Session | null>(initialSession);
  const fetchCart = useAppStore((state) => state.fetchCart);

  useEffect(() => {
    // Listener ini akan menjaga sesi tetap sinkron jika ada perubahan
    // (misalnya, pengguna logout di tab lain).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);

        // Ambil keranjang jika pengguna baru saja login
        if (_event === "SIGNED_IN" && currentSession) {
          console.log(
            "[DEBUG AuthContext] Pengguna SIGNED_IN. Mengambil keranjang...",
          );
          fetchCart();
        }
      },
    );

    // Fungsi cleanup untuk berhenti mendengarkan saat komponen dilepas
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchCart]); // 'supabase' dan 'fetchCart' dimasukkan sebagai dependensi

  const value = { supabase, session };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 5. Buat "custom hook" (tidak ada perubahan di sini)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
