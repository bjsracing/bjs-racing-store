// File: src/components/CartInitializer.jsx
import { useEffect, useState } from "react";
import { useAppStore } from "../lib/store.ts";
import { supabase } from "../lib/supabaseBrowserClient.ts";

function CartInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchCart = useAppStore((state) => state.fetchCart);
  const clearLocalCart = useAppStore((state) => state.clearLocalCart);

  useEffect(() => {
    // Pastikan ini hanya berjalan sekali
    if (isInitialized) return;
    setIsInitialized(true);

    // Langsung coba fetch keranjang saat komponen pertama kali dimuat
    fetchCart();

    // Pasang listener untuk memantau perubahan status login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          console.log("Pengguna terdeteksi login, mengambil data keranjang...");
          fetchCart();
        }
        if (event === "SIGNED_OUT") {
          console.log(
            "Pengguna terdeteksi logout, membersihkan keranjang lokal...",
          );
          clearLocalCart();
        }
      },
    );

    // Cleanup: Hapus listener saat komponen tidak lagi digunakan
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isInitialized, fetchCart, clearLocalCart]);

  // Komponen ini tidak menampilkan UI apapun
  return null;
}

export default CartInitializer;
