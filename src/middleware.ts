// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

// Tambahkan definisi locals. Supabase menyediakan ini sebagai template
declare global {
  namespace App {
    interface Locals {
      supabase: ReturnType<typeof createServerClient>;
      session: any | null; // Atur tipe data session yang sesuai
    }
  }
}

// --- Tentukan halaman yang akan dilindungi ---
const protectedRoutes = ["/cart", "/checkout", "/akun"];
const authRoutes = ["/login", "/register"];

const authMiddleware = defineMiddleware(async (context, next) => {
  // ✅ PERBAIKAN: Menggunakan format TIGA ARGUMEN yang benar
  // Ini akan menyelesaikan error 'Expected 3 arguments, but got 1.'
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

  // --- Logika "Penjaga" ---
  if (!session && protectedRoutes.includes(context.url.pathname)) {
    return context.redirect("/login", 302);
  }

  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/akun", 302);
  }

  return next();
});

// Menggunakan `sequence` untuk mengekspor middleware.
export const onRequest = sequence(authMiddleware);
