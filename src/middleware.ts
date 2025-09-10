// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";
import { supabaseServerClient } from "./lib/supabaseClient.ts";

// Tambahkan definisi locals. Supabase menyediakan ini sebagai template
declare global {
  namespace App {
    interface Locals {
      supabase: ReturnType<typeof supabaseServerClient>;
      session: any | null;
    }
  }
}

// --- Tentukan halaman yang akan dilindungi ---
const protectedRoutes = ["/cart", "/checkout", "/akun"];
const authRoutes = ["/login", "/register"];

const authMiddleware = defineMiddleware(async (context, next) => {
  // ✅ PERBAIKAN: Menggunakan fungsi helper dari supabaseClient.ts
  context.locals.supabase = supabaseServerClient(context);

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

export const onRequest = sequence(authMiddleware);
