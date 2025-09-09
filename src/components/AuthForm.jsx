// File: src/components/AuthForm.jsx
// Perbaikan: Menggunakan hook useAuth() untuk mendapatkan client Supabase dan data sesi.

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuth } from "../lib/authContext.tsx";

const AuthForm = () => {
  // 1. Gunakan hook `useAuth` untuk mendapatkan client supabase, sesi, dan status loading
  const { supabase, session, isLoading } = useAuth();

  // 2. useEffect ini sekarang hanya menangani pengalihan pasca-login
  useEffect(() => {
    // Pastikan supabase sudah siap sebelum memasang listener
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          console.log(
            "[DEBUG AuthForm] Event SIGNED_IN terdeteksi. Memeriksa profil...",
          );

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
    }
  }, [supabase]); // Jalankan efek ini saat supabase sudah tersedia

  // 3. Tampilkan status loading atau pesan mengarahkan jika sesi sudah ada
  if (isLoading || !supabase) {
    return (
      <p className="text-center text-slate-500">
        Memuat komponen autentikasi...
      </p>
    );
  }
  if (session) {
    // Jika pengguna sudah login tapi masih di halaman ini, beri pesan
    return (
      <p className="text-center text-slate-500">
        Sesi terdeteksi, mengarahkan...
      </p>
    );
  }

  // 4. Tampilkan form login jika tidak ada sesi dan loading selesai
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
