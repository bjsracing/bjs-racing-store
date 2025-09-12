// File: src/pages/api/customers.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const POST: APIRoute = async ({ request, locals }) => {
  // --- INILAH BAGIAN YANG MENGGUNAKAN MIDDLEWARE ---
  // Kita mengambil 'session' langsung dari 'locals', yang sudah disiapkan oleh middleware.js
  const { session } = locals;

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

    const { data: newCustomer, error } = await supabaseAdmin
      .from("customers")
      .upsert(
        {
          auth_user_id: session.user.id,
          nama_pelanggan: nama_pelanggan,
          telepon: telepon,
        },
        {
          onConflict: "auth_user_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase admin upsert error:", error);
      return new Response(
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
