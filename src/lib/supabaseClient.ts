// src/lib/supabaseClient.ts
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { APIContext } from "astro";

// Fungsi untuk membuat klien sisi server
// Harus dipanggil di dalam middleware atau API routes
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

// Klien sisi klien/browser
// Harus dipanggil di dalam komponen UI atau client-side scripts
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
