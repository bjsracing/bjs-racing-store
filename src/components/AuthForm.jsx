// src/components/AuthForm.jsx

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
        // --- LOGIKA BARU DITAMBAHKAN DI SINI ---
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
          // PROFIL DITEMUKAN: Ini pengguna lama yang login
          // Arahkan langsung ke halaman akun utama
          console.log("Profil ditemukan, mengarahkan ke /akun");
          window.location.href = "/akun";
        } else {
          // PROFIL TIDAK DITEMUKAN: Ini pengguna baru yang mendaftar
          // Arahkan ke halaman untuk melengkapi profil
          console.log(
            "Profil tidak ditemukan, mengarahkan ke /akun/lengkapi-profil",
          );
          window.location.href = "/akun/lengkapi-profil";
        }
        // --- AKHIR DARI LOGIKA BARU ---
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
