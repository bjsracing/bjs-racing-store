// File: src/pages/api/profile-check.ts
// Deskripsi: Endpoint sederhana yang hanya bertugas memeriksa apakah profil pelanggan sudah ada,
// untuk mengatasi masalah race condition setelah registrasi.

import type { APIRoute, APIContext } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Membuat instance Supabase server client.
 */
function createSupabaseClient(cookies: APIContext["cookies"]) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookies?.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies?.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          cookies?.delete(key, options);
        },
      },
    },
  );
}

export const GET: APIRoute = async ({ cookies }: APIContext) => {
  const supabase = createSupabaseClient(cookies);

  try {
    // 1. Dapatkan pengguna yang terotentikasi dari sesi
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Jika tidak ada sesi login, kembalikan 'not found'
    if (!user) {
      return new Response(
        JSON.stringify({ found: false, message: "No active session" }),
        { status: 401 },
      );
    }

    // 2. Cek ke tabel 'customers' menggunakan .maybeSingle() yang aman
    const { data: customerProfile, error } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error) {
      // Jika ada error saat query, lempar error untuk ditangkap di bawah
      throw error;
    }

    // 3. Kembalikan respons berdasarkan hasil pengecekan
    if (customerProfile) {
      // Profil ditemukan, kirim respons sukses
      return new Response(JSON.stringify({ found: true }), { status: 200 });
    } else {
      // Profil belum ditemukan (kemungkinan karena race condition), kirim status 404
      return new Response(
        JSON.stringify({ found: false, message: "Profile not ready yet" }),
        { status: 404 },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Server error during profile check";
    console.error("Error in /api/profile-check:", message);
    return new Response(JSON.stringify({ found: false, message }), {
      status: 500,
    });
  }
};
