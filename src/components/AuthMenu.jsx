// File: src/components/AuthMenu.jsx
// Perbaikan Final: Menggunakan supabase.auth.getUser() untuk memastikan sesi
// divalidasi server sebelum mengambil data keranjang, mengatasi race condition.

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";
import id from "../../public/locales/id/common.json";
// Gunakan alias path yang stabil untuk impor store
import { useAppStore } from "@/lib/store.ts";

const AuthMenu = () => {
    const [session, setSession] = useState(null);
    const fetchCart = useAppStore((state) => state.fetchCart);

    useEffect(() => {
        // --- PERBAIKAN UTAMA: Gunakan getUser() untuk sinkronisasi dengan server ---
        const checkUserSession = async () => {
            // Cek sesi awal dengan metode yang divalidasi server
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setSession(user ? { user } : null); // Simpan sesi jika user ditemukan

            // Jika ada pengguna yang valid, ambil data keranjang
            if (user) {
                fetchCart();
            }
        };

        checkUserSession(); // Jalankan pengecekan awal saat komponen dimuat

        // Listener tetap diperlukan untuk menangani login/logout secara real-time
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            // Jika ada sesi baru (login), ambil keranjang.
            // Jika tidak ada (logout), state keranjang akan dikosongkan oleh komponen lain.
            if (newSession) {
                fetchCart();
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchCart]);

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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Redirect ke halaman utama. State non-persisten akan otomatis di-reset.
        window.location.href = "/";
    };

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
