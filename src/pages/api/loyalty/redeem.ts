// File: src/pages/api/loyalty/redeem.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const POST: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan." }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { points } = body;

    if (!points || Number(points) <= 0) {
      return new Response(
        JSON.stringify({ message: "Jumlah poin tidak valid." }),
        { status: 400 }
      );
    }

    const redeemPoints = Number(points);

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();

    if (!customer) {
      return new Response(
        JSON.stringify({ message: "Profil customer tidak ditemukan." }),
        { status: 404 }
      );
    }

    const { data: existingPoints, error: pointsError } =
      await supabaseAdmin
        .from("loyalty_points")
        .select("points")
        .eq("customer_id", customer.id);

    if (pointsError) throw pointsError;

    const totalPoints = (existingPoints || []).reduce(
      (sum, p) => sum + p.points,
      0
    );

    if (totalPoints < redeemPoints) {
      return new Response(
        JSON.stringify({ message: "Poin Anda tidak mencukupi." }),
        { status: 400 }
      );
    }

    const discountValue = redeemPoints * 10;

    const code = `LOYAL-${customer.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from("vouchers")
      .insert({
        code,
        description: `Hadiah Loyalty: Diskon Rp${discountValue.toLocaleString("id-ID")}`,
        type: "fixed_amount",
        discount_value: discountValue,
        min_purchase: 0,
        is_active: true,
        valid_until: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        usage_limit: 1,
      })
      .select()
      .single();

    if (voucherError || !voucher) throw voucherError;

    await supabaseAdmin.from("customer_vouchers").insert({
      customer_id: customer.id,
      voucher_id: voucher.id,
    });

    await supabaseAdmin.from("loyalty_points").insert({
      customer_id: customer.id,
      points: -redeemPoints,
      type: "redeemed",
      description: `Tukar ${redeemPoints} poin menjadi voucher diskon Rp${discountValue}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        voucher_code: voucher.code,
        discount_value: voucher.discount_value,
        message: `Berhasil menukar ${redeemPoints} poin menjadi voucher diskon Rp${discountValue.toLocaleString("id-ID")}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Redeem loyalty error:", error);
    return new Response(
      JSON.stringify({ message: "Gagal menukar poin." }),
      { status: 500 }
    );
  }
};
