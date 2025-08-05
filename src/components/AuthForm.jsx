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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Jika berhasil login, arahkan ke halaman utama
        window.location.href = "/";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "400px", margin: "auto" }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={["google"]} // Anda bisa menambahkan provider lain seperti 'github', 'facebook'
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
