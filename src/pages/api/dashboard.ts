// File: /src/pages/api/dashboard.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const GET: APIRoute = async ({ locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    // 1. Ambil data customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, nama_pelanggan")
      .eq("auth_user_id", session.user.id)
      .single();

    if (customerError) throw customerError;

    // 2. Ambil pesanan terakhir (jika ada)
    const { data: latest_order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // .maybeSingle() agar tidak error jika tidak ada pesanan

    // 3. Ambil alamat utama (atau yang terbaru jika tidak ada yang utama)
    const { data: primary_address } = await supabaseAdmin
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Gabungkan dan kirim hasilnya
    const dashboardData = {
      customer_name: customer.nama_pelanggan,
      latest_order: latest_order,
      primary_address: primary_address,
    };

    return new Response(JSON.stringify(dashboardData), { status: 200 });
  } catch (error) {
    console.error("API /api/dashboard Error:", error);
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
};
