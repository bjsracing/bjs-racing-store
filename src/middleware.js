// src/middleware.js (Versi Final untuk Astro)

import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Membuat Supabase client yang spesifik untuk setiap request di server
  context.locals.supabase = createServerClient(
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

  // Mengambil sesi pengguna dan menyediakannya untuk semua halaman
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();
  context.locals.session = session;

  // Lanjutkan ke halaman berikutnya
  return next();
});
