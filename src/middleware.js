// src/middleware.js
import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

const protectedRoutes = ["/cart", "/checkout", "/akun"];
const authRoutes = ["/login", "/register"];
// Halaman yang dikecualikan dari pengecekan profil lengkap
const profileExceptions = ["/akun/lengkapi-profil"];

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

  const pathname = context.url.pathname;

  // Gerbang 1: Cek otentikasi (apakah sudah login?)
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return context.redirect("/login?redirect=" + pathname, 302);
  }
  if (session && authRoutes.includes(pathname)) {
    return context.redirect("/akun", 302);
  }

  // --- PERBAIKAN UTAMA DI SINI ---
  // Gerbang 2: Cek otorisasi (apakah profil sudah lengkap?)
  if (session) {
    // Cek ini berjalan untuk SEMUA HALAMAN TERPROTEKSI, kecuali halaman pengecualian
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) &&
      !profileExceptions.some((route) => pathname.startsWith(route))
    ) {
      // Query yang benar untuk menghitung baris
      const { count, error } = await context.locals.supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("auth_user_id", session.user.id);

      if (error) {
        console.error("Middleware profile check error:", error);
        // Jika ada error saat query, biarkan lolos agar tidak mengunci pengguna
        return next();
      }

      // Jika hitungan profil adalah 0, paksa redirect
      if (count === 0) {
        return context.redirect("/akun/lengkapi-profil", 302);
      }
    }
  }

  return next();
});
