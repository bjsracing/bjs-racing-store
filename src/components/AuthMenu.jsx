// File: src/components/AuthMenu.jsx
// Perbaikan: Menambahkan pemanggilan clearCart() saat logout.

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import id from "../locales/id/common.json";

// 1. Impor store Zustand Anda (pastikan path dan ekstensi .ts benar)
import { useAppStore } from "../lib/store.ts";

const AuthMenu = () => {
    const [session, setSession] = useState(null);

    // 2. Ambil aksi `clearCart` dari store Zustand
    const { clearCart } = useAppStore();

    useEffect(() => {
        // Ambil sesi awal
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Dengarkan perubahan status autentikasi
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Hentikan langganan saat komponen dilepas
        return () => subscription.unsubscribe();
    }, []);

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

    /**
     * Menangani proses logout:
     * 1. Membersihkan keranjang belanja dari localStorage.
     * 2. Melakukan sign out dari Supabase.
     * 3. Mengarahkan pengguna ke halaman utama.
     */
    const handleLogout = async () => {
        // 3. Panggil clearCart() SEBELUM proses sign out
        clearCart();

        // Lanjutkan proses logout seperti biasa
        await supabase.auth.signOut();
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
