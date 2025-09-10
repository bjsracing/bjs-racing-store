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
  "/keranjang",
  "/checkout",
  "/akun",
  "/akun/lengkapi-profil",
  "/akun/profil",
  "/akun/pesanan",
  "/akun/alamat",
];

const authRoutes = ["/login", "/register"];

const supabaseAuthMiddleware = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseServerClient(context);

  const {
    data: { session },
    error,
  } = await context.locals.supabase.auth.getSession();

  context.locals.session = session;

  if (error) {
    console.error("Supabase getSession error:", error);
  }

  if (!session && protectedRoutes.includes(context.url.pathname)) {
    return context.redirect("/login", 302);
  }

  if (session && authRoutes.includes(context.url.pathname)) {
    return context.redirect("/", 302);
  }

  return next();
});

export const onRequest = sequence(supabaseAuthMiddleware);
