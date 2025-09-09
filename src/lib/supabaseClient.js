// File: src/lib/supabaseClient.js
// Perbaikan: Menggunakan pola singleton untuk memastikan createBrowserClient
// hanya dipanggil di lingkungan browser.

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance = null;

export function getSupabaseBrowserClient() {
  // Jika instance client belum dibuat, buat sekarang.
  if (!supabaseInstance) {
    console.log(
      "[DEBUG supabaseClient] Membuat instance Supabase Browser Client untuk pertama kali.",
    );
    supabaseInstance = createBrowserClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  // Kembalikan instance yang sudah ada.
  return supabaseInstance;
}
