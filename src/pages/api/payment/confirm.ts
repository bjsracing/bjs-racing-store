// File: src/pages/api/payment/confirm.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import { confirmOrderPayment } from "@/lib/confirmOrderPayment.ts";
import { requireAdmin } from "@/lib/adminAuth.ts";

export const POST: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (!auth.ok) {
    return new Response(JSON.stringify({ message: auth.message }), {
      status: auth.status,
    });
  }
  try {
    const { order_id } = await context.request.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ message: "order_id wajib diisi." }),
        { status: 400 },
      );
    }
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number")
      .eq("id", order_id)
      .single();
    if (error || !order) {
      return new Response(
        JSON.stringify({ message: "Order tidak ditemukan." }),
        { status: 404 },
      );
    }
    const result = await confirmOrderPayment(order.order_number);
    if (!result.ok) {
      return new Response(JSON.stringify({ message: result.error }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ status: "paid" }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      }),
      { status: 500 },
    );
  }
};
