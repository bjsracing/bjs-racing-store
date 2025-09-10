// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";
import { supabaseServerClient } from "./lib/supabaseClient.ts";

// Deklarasi global locals agar TypeScript tidak error
declare global {
  namespace App {
    interface Locals {
      supabase: ReturnType<typeof supabaseServerClient>;
      session: any | null;
    }
  }
}

const protectedRoutes = ["/cart", "/checkout", "/akun", "/akun/lengkapi-profil", "/akun/profil", "/akun/pesanan", "/akun/alamat"];
const authRoutes = ["/login", "/register"];

const supabaseAuthMiddleware = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseServerClient(context);

  const {
    data: { session },
    error,
  } = await context.locals.supabase.auth.getSession();

  context.locals.session = session;

  // ✅ Logika DEBUG: Cetak status sesi ke konsol
  console.log(`[AUTH-DEBUG] Path: ${context.url.pathname}`);
  console.log(`[AUTH-DEBUG] Session found: ${!!session}`);
  if (session) {
      console.log(`[AUTH-DEBUG] User ID: ${session.user.id}`);
  }

  // Cek jika ada error
  if (error) {
    console.error("[AUTH-DEBUG] Supabase getSession error:", error);
  }

  // Logika pengalihan untuk halaman yang dilindungi
  if (!session && protectedRoutes.includes(context.url.pathname)) {
    return context.redirect("/login", 302);
  }

  // Logika pengalihan untuk halaman autentikasi
  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/akun", 302);
  }

  return next();
});

export const onRequest = sequence(supabaseAuthMiddleware);