// File: /src/pages/api/vouchers/claim.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const POST: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session)
    return new Response(JSON.stringify({ message: "Otentikasi diperlukan." }), {
      status: 401,
    });

  try {
    const { voucher_id } = await request.json();
    if (!voucher_id) throw new Error("Voucher ID diperlukan.");

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();
    if (!customer) throw new Error("Profil customer tidak ditemukan.");

    // Masukkan voucher ke "dompet" pengguna
    const { error } = await supabaseAdmin
      .from("customer_vouchers")
      .insert({ customer_id: customer.id, voucher_id: voucher_id });

    if (error) {
      // Jika error karena duplikat (unique constraint), berarti pengguna sudah pernah klaim
      if (error.code === "23505") {
        throw new Error("Anda sudah pernah mengklaim voucher ini.");
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Voucher berhasil diklaim!" }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 400,
    });
  }
};
