// File: src/lib/supabaseClient.js
// Perbaikan Definitif: Menggunakan pola singleton untuk memastikan
// createBrowserClient HANYA dipanggil di lingkungan browser.

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance = null;

// Ini adalah satu-satunya fungsi yang akan diekspor.
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
