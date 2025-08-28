// src/middleware.js (Versi Final untuk Astro)

import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

// --- PENAMBAHAN 1: Tentukan halaman yang akan dilindungi ---
const protectedRoutes = ["/cart", "/checkout", "/akun"]; // Tambahkan halaman lain jika perlu, misal: /pilok
const authRoutes = ["/login", "/register"]; // Halaman yang seharusnya tidak diakses jika sudah login

export const onRequest = defineMiddleware(async (context, next) => {
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

  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();
  context.locals.session = session;

  // --- PENAMBAHAN 2: Logika "Penjaga" ---

  // Jika pengguna belum login dan mencoba akses halaman terproteksi
  if (!session && protectedRoutes.includes(context.url.pathname)) {
    return context.redirect("/login", 302);
  }

  // Jika pengguna sudah login dan mencoba akses halaman login/register
  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/akun", 302); // Alihkan ke halaman akun atau dashboard
  }

  return next();
});
