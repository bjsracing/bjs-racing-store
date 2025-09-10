// src/lib/supabaseClient.ts

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { APIContext } from "astro";

// Klien sisi server untuk digunakan di middleware
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

// Klien sisi klien untuk digunakan di komponen React
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
