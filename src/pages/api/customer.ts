// src/pages/api/customers.ts
import type { APIRoute } from 'astro';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) { return cookies.get(key)?.value; },
        set(key: string, value: string, options: CookieOptions) { cookies.set(key, value, options); },
        remove(key: string, options: CookieOptions) { cookies.delete(key, options); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response(JSON.stringify({ message: "Otentikasi diperlukan." }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { nama_pelanggan, telepon } = body;

    if (!nama_pelanggan) {
      return new Response(JSON.stringify({ message: "Nama lengkap wajib diisi." }), { status: 400 });
    }

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        auth_user_id: session.user.id, 
        nama_pelanggan: nama_pelanggan,
        telepon: telepon,
      })
      .select()
      .single();

    // ✅ PERUBAHAN UTAMA ADA DI SINI
    if (error) {
      console.error("Supabase insert error:", error);
      // Jangan kirim pesan umum. Kirim pesan error asli dari Supabase.
      return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(newCustomer), { status: 201 });

  } catch (err) {
    console.error("Gagal memproses permintaan:", err);
    return new Response(JSON.stringify({ message: "Terjadi kesalahan pada server." }), { status: 500 });
  }
};