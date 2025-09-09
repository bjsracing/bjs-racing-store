// File: src/components/AuthMenu.jsx
// Perbaikan: Menambahkan pemanggilan fetchCart() saat sesi login terdeteksi.

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import id from "../../public/locales/id/common.json";
import { useAppStore } from "../lib/store.ts";

const AuthMenu = () => {
    const [session, setSession] = useState(null);

    // Ambil aksi `fetchCart` dari store Zustand
    const fetchCart = useAppStore((state) => state.fetchCart);

    useEffect(() => {
        // Ambil sesi awal saat komponen dimuat
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // Jika ada sesi saat halaman dimuat, langsung ambil data keranjang
            if (session) {
                fetchCart();
            }
        });

        // Dengarkan perubahan status autentikasi
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            // Jika event-nya adalah SIGNED_IN (login berhasil),
            // ambil data keranjang dari database.
            if (session) {
                fetchCart();
            }
        });

        // Hentikan langganan saat komponen dilepas
        return () => subscription.unsubscribe();
    }, [fetchCart]); // Tambahkan fetchCart sebagai dependensi

    // Tampilan jika pengguna belum login
    if (!session) {
        return (
            <a
                href="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                {id.nav.login_register}
            </a>
        );
    }

    // Fungsi logout tetap sama, tanpa clearCart()
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Arahkan ke halaman utama, yang akan secara otomatis membersihkan state non-persisten
        window.location.href = "/";
    };

    // Tampilan jika pengguna sudah login
    return (
        <div className="flex items-center gap-3">
            <a
                href="/akun"
                className="text-sm font-semibold text-slate-600 hover:text-orange-500"
            >
                {session.user.email}
            </a>
            <button
                onClick={handleLogout}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Logout
            </button>
        </div>
    );
};

export default AuthMenu;
