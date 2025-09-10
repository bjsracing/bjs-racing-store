// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";
import { supabaseServerClient } from "./lib/supabaseClient.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: ReturnType<typeof supabaseServerClient>;
      session: any | null;
    }
  }
}

const protectedRoutes = [
  "/cart",
  "/checkout",
  "/akun",
  "/akun/lengkapi-profil",
  "/akun/profil",
  "/akun/pesanan",
  "/akun/alamat",
];
const authRoutes = ["/login", "/register"];

const supabaseAuthMiddleware = defineMiddleware(async (context, next) => {
  // Buat klien Supabase server-side untuk setiap permintaan.
  context.locals.supabase = supabaseServerClient(context);

  const {
    data: { session },
    error,
  } = await context.locals.supabase.auth.getSession();

  context.locals.session = session;

  if (error) {
    console.error("Supabase getSession error:", error);
  }

  // Jika pengguna belum login dan mencoba akses halaman terproteksi
  if (!session && protectedRoutes.includes(context.url.pathname)) {
    return context.redirect("/login", 302);
  }

  // Jika pengguna sudah login dan mencoba akses halaman login/register
  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/", 302);
  }

  return next();
});

export const onRequest = sequence(supabaseAuthMiddleware);
