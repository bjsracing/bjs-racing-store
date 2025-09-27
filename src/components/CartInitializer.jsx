// File: src/components/CartInitializer.jsx
import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store.ts";
import { supabase } from "../lib/supabaseBrowserClient.ts";

function CartInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchCart = useAppStore((state) => state.fetchCart);
  const clearLocalCart = useAppStore((state) => state.clearLocalCart);
  const setSession = useAppStore((state) => state.setSession);

  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    // Ambil sesi awal saat komponen pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Jika sudah ada sesi, langsung ambil data keranjang
      if (session) {
        fetchCart();
      }
    });

    // Pasang listener untuk memantau perubahan sesi (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Setiap kali sesi berubah, perbarui state di Zustand
      setSession(session);

      if (event === "SIGNED_IN") {
        fetchCart();
      }
      if (event === "SIGNED_OUT") {
        clearLocalCart();
      }
    });

    // Hapus listener saat komponen tidak lagi digunakan
    return () => {
      subscription?.unsubscribe();
    };
  }, [isInitialized, fetchCart, clearLocalCart, setSession]);

  return null;
}

export default CartInitializer;
