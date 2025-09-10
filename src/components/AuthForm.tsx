// File: src/components/AuthForm.tsx (Sangat disarankan di-rename ke .tsx)
// Perbaikan: Menghilangkan 'isLoading', menyederhanakan logika, dan menangani redirect secara lebih efektif.

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuth } from "../lib/authContext"; // Path sudah .tsx, jadi lebih baik konsisten

const AuthForm = () => {
  // 1. 'isLoading' sudah tidak ada lagi, kita hanya butuh supabase dan session.
  const { supabase, session } = useAuth();

  useEffect(() => {
    // 2. Logika ini sekarang menangani SEMUA kasus redirect di sisi klien.

    // Kasus 1: Pengguna sudah login saat halaman dimuat.
    // 'session' akan tersedia langsung dari 'initialSession' yang kita atur sebelumnya.
    if (session) {
      // Ambil URL redirect dari parameter, atau default ke '/akun'
      const redirectUrl =
        new URLSearchParams(window.location.search).get("redirect") || "/akun";
      window.location.href = redirectUrl;
      return; // Hentikan eksekusi lebih lanjut
    }

    // Kasus 2: Pengguna baru saja berhasil login melalui form.
    // Kita tetap pasang listener untuk event ini.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "SIGNED_IN" && newSession) {
        console.log(
          "[DEBUG AuthForm] Event SIGNED_IN terdeteksi. Mengarahkan...",
        );

        // Logika pengecekan profil Anda sudah bagus, kita pertahankan.
        const { data: customerProfile } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", newSession.user.id)
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

    // Cleanup listener
    return () => subscription.unsubscribe();
  }, [session, supabase]); // Efek ini bergantung pada session dan supabase

  // 3. Tampilkan pesan redirect jika sesi terdeteksi, atau form jika tidak.
  // Ini akan ditampilkan sesaat sebelum useEffect melakukan redirect.
  if (session) {
    return (
      <p className="text-center text-slate-500">
        Anda sudah login. Mengarahkan ke halaman akun...
      </p>
    );
  }

  // 4. Render Supabase Auth UI jika tidak ada sesi.
  // Kita tambahkan pengecekan 'supabase' untuk memastikan client sudah siap.
  return supabase ? (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={["google"]}
      // Opsi lokalisasi Anda sudah benar, tidak perlu diubah.
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
  ) : null; // Jangan render apapun jika supabase client belum siap
};

export default AuthForm;
