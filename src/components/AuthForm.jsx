// File: src/components/AuthForm.jsx
// Perbaikan: Menggunakan getSupabaseBrowserClient() yang aman.

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
// PERBAIKAN 1: Impor fungsi, bukan konstanta
import { getSupabaseBrowserClient } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/authContext.tsx";

const AuthForm = () => {
  const { session, isLoading } = useAuth();

  // PERBAIKAN 2: Panggil fungsi untuk mendapatkan client Supabase
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!isLoading && session) {
      window.location.href = "/akun";
    }
  }, [session, isLoading]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data: customerProfile } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (customerProfile) {
          const redirectUrl =
            new URLSearchParams(window.location.search).get("redirect") ||
            "/akun";
          window.location.href = redirectUrl;
        } else {
          window.location.href = "/akun/lengkapi-profil";
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  if (isLoading || session) {
    return <p className="text-center text-slate-500">Memverifikasi sesi...</p>;
  }

  return (
    <div style={{ width: "100%", maxWidth: "400px", margin: "auto" }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={["google"]}
        localization={{
          variables: {
            sign_in: {
              email_label: "Alamat Email",
              password_label: "Kata Sandi",
              button_label: "Masuk",
            },
            sign_up: {
              email_label: "Alamat Email",
              password_label: "Kata Sandi",
              button_label: "Daftar",
            },
            forgotten_password: {
              email_label: "Alamat Email",
              button_label: "Kirim Instruksi Reset",
              link_text: "Lupa Kata Sandi?",
            },
          },
        }}
      />
    </div>
  );
};

export default AuthForm;
