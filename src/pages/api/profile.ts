// File: /src/pages/api/profile.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

// --- FUNGSI GET: Mengambil data profil saat ini ---
export const GET: APIRoute = async ({ locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select("nama_pelanggan, telepon")
      .eq("auth_user_id", session.user.id)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(customer), { status: 200 });
  } catch (error) {
    // --- PERBAIKAN DI SINI ---
    let errorMessage = "Gagal memuat profil.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API GET /api/profile Error:", error);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};

// --- FUNGSI PUT: Memperbarui data profil ---
export const PUT: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    const { nama_pelanggan, telepon } = await request.json();

    if (!nama_pelanggan || !telepon) {
      return new Response(
        JSON.stringify({ message: "Nama dan telepon wajib diisi." }),
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .update({
        nama_pelanggan: nama_pelanggan,
        telepon: telepon,
      })
      .eq("auth_user_id", session.user.id)
      .select("nama_pelanggan, telepon")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    // --- PERBAIKAN DI SINI ---
    let errorMessage = "Gagal menyimpan profil.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API PUT /api/profile Error:", error);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};
