// File: src/components/AuthForm.jsx
// Perbaikan: Mengembalikan logika smart redirect untuk mencegah race condition.

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient.js";

const AuthForm = () => {
  useEffect(() => {
    // Listener untuk mendeteksi perubahan status login
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Hanya jalankan jika event adalah SIGNED_IN dan ada sesi
      if (event === "SIGNED_IN" && session) {
        // --- LOGIKA KUNCI UNTUK MENCEGAH RACE CONDITION ---
        // Cek apakah profil pelanggan sudah ada di database kita
        const { data: customerProfile, error } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle(); // .maybeSingle() tidak error jika data tidak ditemukan

        if (error) {
          console.error("Gagal memeriksa profil pelanggan:", error);
          // Jika terjadi error, arahkan ke halaman utama sebagai fallback
          window.location.href = "/";
          return;
        }

        if (customerProfile) {
          // PROFIL DITEMUKAN: Pengguna lama yang login
          // Arahkan langsung ke halaman akun
          const redirectUrl =
            new URLSearchParams(window.location.search).get("redirect") ||
            "/akun";
          window.location.href = redirectUrl;
        } else {
          // PROFIL TIDAK DITEMUKAN: Pengguna baru yang mendaftar
          // Arahkan ke halaman untuk melengkapi profil
          window.location.href = "/akun/lengkapi-profil";
        }
        // --- AKHIR DARI LOGIKA KUNCI ---
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
