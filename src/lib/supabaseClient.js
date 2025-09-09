// File: src/lib/supabaseClient.js
// Perbaikan: Menggunakan pola singleton untuk memastikan createBrowserClient
// hanya dipanggil di lingkungan browser, bukan di server.

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance = null;

// Fungsi ini adalah satu-satunya yang diekspor.
export function getSupabaseBrowserClient() {
  // Jika instance client belum dibuat, buat sekarang.
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  // Kembalikan instance yang sudah ada atau yang baru dibuat.
  return supabaseInstance;
}