// File: src/components/AuthForm.jsx
import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabaseBrowserClient.ts";

const AuthForm = () => {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          // --- PERBAIKAN: Panggil fungsi RPC yang lebih andal ---
          const { data: profileExists, error } = await supabase.rpc(
            "check_if_customer_profile_exists",
          );

          if (error) {
            console.error("Gagal memeriksa profil:", error);
            window.location.href = "/"; // Fallback ke home jika error
            return;
          }

          if (profileExists) {
            console.log("Profil ditemukan, mengarahkan ke /akun");
            window.location.href = "/akun";
          } else {
            console.log(
              "Profil tidak ditemukan, mengarahkan ke /akun/lengkapi-profil",
            );
            window.location.href = "/akun/lengkapi-profil";
          }
        } catch (e) {
          console.error("Error tak terduga saat memeriksa profil:", e);
          window.location.href = "/";
        }
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
