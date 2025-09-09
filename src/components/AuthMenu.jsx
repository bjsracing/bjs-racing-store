// File: src/components/AuthMenu.jsx
// Perbaikan: Refactor total untuk menggunakan hook useAuth() dari AuthContext,
// menghilangkan semua logika state management lokal.

import React from "react";
// 1. Impor custom hook `useAuth` yang baru kita buat
import { useAuth } from "../lib/authContext.tsx";
import id from "../../public/locales/id/common.json";
import { supabase } from "../lib/supabaseClient.js"; // Tetap diperlukan untuk signOut

const AuthMenu = () => {
    // 2. Gunakan hook `useAuth` untuk mendapatkan data sesi dan status loading
    const { session, isLoading } = useAuth();

    // Fungsi logout tetap sederhana
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Arahkan ke halaman utama, AuthProvider akan menangani sisa perubahan state
        window.location.href = "/";
    };

    // 3. Tampilkan status loading saat AuthProvider sedang memvalidasi sesi
    if (isLoading) {
        return (
            <div className="text-sm font-semibold text-slate-400 animate-pulse">
                Memuat...
            </div>
        );
    }

    // 4. Tampilkan tombol Login jika tidak ada sesi
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

    // 5. Tampilkan email pengguna dan tombol Logout jika ada sesi
    return (
        <div className="flex items-center gap-3">
            <a
                href="/akun"
                className="text-sm font-semibold text-slate-600 hover:text-orange-500 truncate max-w-[150px]"
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
