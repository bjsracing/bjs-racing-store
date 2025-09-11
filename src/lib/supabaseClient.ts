// File: src/lib/supabaseClient.ts

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js"; // <-- Tambahkan impor ini
import type { APIContext } from "astro";

// Klien sisi server untuk digunakan di middleware (menggunakan kunci publik)
export function supabaseServerClient(context: APIContext) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, options),
        remove: (key, options) => context.cookies.delete(key, options),
      },
    },
  );
}

// Klien sisi klien untuk digunakan di komponen React (menggunakan kunci publik)
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

// --- TAMBAHAN BARU: KLIEN ADMIN UNTUK DIGUNAKAN DI SERVER API ---
// Klien ini menggunakan Service Role Key dan BISA MELEWATI RLS.
// Gunakan HANYA di lingkungan server yang aman (API routes).
export const supabaseAdmin = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY, // <-- Menggunakan Service Key!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
