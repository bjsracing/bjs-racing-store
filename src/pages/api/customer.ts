// src/pages/api/customers.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Buat Supabase client versi server untuk otentikasi aman
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          cookies.delete(key, options);
        },
      },
    },
  );

  // 2. Dapatkan sesi pengguna dari cookie untuk memastikan dia sudah login
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return new Response("Otentikasi diperlukan.", { status: 401 });
  }

  try {
    // 3. Ambil data (nama & telepon) yang dikirim dari formulir
    const body = await request.json();
    const { nama_pelanggan, telepon } = body;

    // 4. Validasi input: pastikan nama pelanggan tidak kosong
    if (!nama_pelanggan) {
      return new Response("Nama lengkap wajib diisi.", { status: 400 });
    }

    // 5. Simpan data ke tabel 'customers'
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        // Tautkan profil pelanggan ini dengan akun otentikasi pengguna
        auth_user_id: session.user.id,
        nama_pelanggan: nama_pelanggan,
        telepon: telepon,
        // Anda bisa menambahkan nilai default lainnya di sini jika perlu
      })
      .select()
      .single();

    // 6. Tangani jika terjadi error saat penyimpanan
    if (error) {
      // Kemungkinan error jika profil untuk user ini sudah ada
      if (error.code === "23505") {
        // Kode error untuk duplicate key
        return new Response("Profil untuk pengguna ini sudah ada.", {
          status: 409,
        });
      }
      throw error; // Lemparkan error lain untuk ditangkap di bawah
    }

    // 7. Jika berhasil, kirim kembali data profil yang baru dibuat
    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (err) {
    console.error("Gagal membuat profil pelanggan:", err);
    return new Response("Terjadi kesalahan di server.", { status: 500 });
  }
};
