// src/middleware.js
import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

// Daftar halaman yang butuh login
const protectedRoutes = ["/cart", "/checkout", "/akun"];
// Daftar halaman yang tidak boleh diakses jika sudah login
const authRoutes = ["/login", "/register"];

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
    // Cek ini sekarang berjalan untuk SEMUA HALAMAN TERPROTEKSI
    if (
      protectedRoutes.some((route) => pathname.startsWith(route)) &&
      pathname !== "/akun/lengkapi-profil"
    ) {
      const { data: customerProfile } = await context.locals.supabase
        .from("customers")
        .select("id", { count: "exact", head: true }) // Query lebih cepat, hanya cek keberadaan
        .eq("auth_user_id", session.user.id);

      // Jika data customer tidak ada (count: 0), paksa redirect
      if (customerProfile.count === 0) {
        return context.redirect("/akun/lengkapi-profil", 302);
      }
    }
  }

  return next();
});
