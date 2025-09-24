// File: /src/pages/api/addresses/set-primary.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const PUT: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    const { address_id } = await request.json();
    if (!address_id) throw new Error("ID Alamat diperlukan.");

    const { error } = await supabaseAdmin.rpc("set_primary_address", {
      p_address_id: address_id,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Alamat utama berhasil diperbarui." }),
      { status: 200 },
    );
  } catch (error) {
    // --- PERBAIKAN DI SINI ---
    let errorMessage = "Gagal menjadikan alamat utama.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API set-primary Error:", error);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};
