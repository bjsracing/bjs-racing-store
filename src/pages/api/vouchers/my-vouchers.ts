// File: /src/pages/api/vouchers/my-vouchers.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const GET: APIRoute = async ({ locals }) => {
  const { session } = locals;
  if (!session)
    return new Response(JSON.stringify({ message: "Otentikasi diperlukan." }), {
      status: 401,
    });

  try {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();
    if (!customer) throw new Error("Profil customer tidak ditemukan.");

    // Ambil semua voucher milik customer yang belum digunakan dan masih aktif
    const { data, error } = await supabaseAdmin
      .from("customer_vouchers")
      .select(
        `
        id,
        is_used,
        vouchers (
          id, code, description, type, discount_value, max_discount, min_purchase, valid_until
        )
      `,
      )
      .eq("customer_id", customer.id)
      .eq("is_used", false)
      .gt("vouchers.valid_until", new Date().toISOString());

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
};
