// src/components/AuthMenu.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import id from "../../public/locales/id/common.json";

const AuthMenu = () => {
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Ambil sesi awal
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Dengarkan perubahan
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

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
        window.location.href = "/"; // Refresh ke halaman utama setelah logout
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
