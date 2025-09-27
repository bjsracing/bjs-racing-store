// File: src/components/CartInitializer.jsx
import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store.ts";
import { supabase } from "../lib/supabaseBrowserClient.ts";

function CartInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchCart = useAppStore((state) => state.fetchCart);
  const clearLocalCart = useAppStore((state) => state.clearLocalCart);
  // Ambil fungsi 'set' dari Zustand untuk memperbarui state secara manual
  const setSession = useAppStore((state) => state.setSession);

  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    // Saat pertama kali dimuat, ambil sesi dan keranjang
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        fetchCart();
      }
    };
    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Setiap kali sesi berubah, perbarui state di Zustand
        setSession(session);

        if (event === "SIGNED_IN") {
          fetchCart();
        }
        if (event === "SIGNED_OUT") {
          clearLocalCart();
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isInitialized, fetchCart, clearLocalCart, setSession]);

  return null;
}

export default CartInitializer;
