// File: src/components/AuthMenu.jsx
// Perbaikan: Menggunakan fungsi getSupabaseBrowserClient() yang aman.

import React, { useState, useEffect } from "react";
// PERBAIKAN 1: Impor fungsi, bukan konstanta
import { getSupabaseBrowserClient } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/authContext.tsx";
import id from "../../public/locales/id/common.json";

const AuthMenu = () => {
    const { session, isLoading } = useAuth();

    // PERBAIKAN 2: Panggil fungsi untuk mendapatkan client Supabase
    const supabase = getSupabaseBrowserClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    if (isLoading) {
        return (
            <div className="text-sm font-semibold text-slate-400 animate-pulse">
                Memuat...
            </div>
        );
    }

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
