// File: src/components/AuthForm.jsx
// Perbaikan: Menyederhanakan dengan useAuth dan mempertahankan logika smart redirect.

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/authContext.tsx"; // Impor hook useAuth

const AuthForm = () => {
  // Gunakan useAuth untuk memeriksa apakah sudah ada sesi aktif saat komponen dimuat.
  const { session, isLoading } = useAuth();

  useEffect(() => {
    // Logika untuk pengguna yang sudah login tapi mencoba mengakses halaman login.
    // Jika loading selesai dan sesi ditemukan, arahkan pengguna pergi dari halaman login.
    if (!isLoading && session) {
      console.log("[DEBUG AuthForm] Sesi sudah ada, mengarahkan ke /akun...");
      window.location.href = "/akun";
    }
  }, [session, isLoading]);

  useEffect(() => {
    // Listener ini tetap penting untuk menangani event SETELAH login/daftar berhasil.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log(
          "[DEBUG AuthForm] Event SIGNED_IN terdeteksi. Memeriksa profil...",
        );

        // Cek apakah profil pelanggan sudah ada di database
        const { data: customerProfile, error } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Gagal memeriksa profil pelanggan:", error);
          window.location.href = "/"; // Fallback jika ada error
          return;
        }

        if (customerProfile) {
          // PROFIL DITEMUKAN: Pengguna lama
          console.log(
            "[DEBUG AuthForm] Profil ditemukan. Mengarahkan ke /akun...",
          );
          const redirectUrl =
            new URLSearchParams(window.location.search).get("redirect") ||
            "/akun";
          window.location.href = redirectUrl;
        } else {
          // PROFIL TIDAK DITEMUKAN: Pengguna baru
          console.log(
            "[DEBUG AuthForm] Profil tidak ditemukan. Mengarahkan ke /akun/lengkapi-profil...",
          );
          window.location.href = "/akun/lengkapi-profil";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Dependensi kosong agar hanya berjalan sekali

  // Jangan render form jika sesi sedang divalidasi atau sudah ada
  if (isLoading || session) {
    return <p className="text-center text-slate-500">Memverifikasi sesi...</p>;
  }

  // Tampilkan form login/register jika tidak ada sesi dan loading selesai
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
