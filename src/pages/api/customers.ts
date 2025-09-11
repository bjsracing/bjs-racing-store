// src/pages/api/customers.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Asumsi createSupabaseClient helper function sudah ada atau inisialisasi client di sini

export const POST: APIRoute = async ({ request, cookies }) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return new Response(JSON.stringify({ message: "Otentikasi diperlukan." }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { nama_pelanggan, telepon } = body;

    if (!nama_pelanggan) {
      return new Response(
        JSON.stringify({ message: "Nama lengkap wajib diisi." }),
        { status: 400 },
      );
    }

    // --- PERBAIKAN UTAMA: Gunakan UPSERT ---
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .upsert(
        {
          auth_user_id: session.user.id, // Kunci konflik
          nama_pelanggan: nama_pelanggan,
          telepon: telepon,
        },
        {
          onConflict: "auth_user_id", // Kolom yang digunakan untuk mendeteksi konflik
        },
      )
      .select()
      .single(); // Ambil data yang baru di-upsert

    if (error) {
      console.error("Supabase upsert error:", error);
      return new Response(
        // Kirim pesan error database yang sebenarnya (lebih baik untuk debugging)
        JSON.stringify({
          message: error.message || "Gagal menyimpan profil ke database.",
        }),
        { status: 500 },
      );
    }

    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (err) {
    console.error("Gagal memproses permintaan:", err);
    return new Response(
      JSON.stringify({ message: "Terjadi kesalahan pada server." }),
      { status: 500 },
    );
  }
};
