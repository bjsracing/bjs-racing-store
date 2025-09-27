// File: /src/pages/api/vouchers/public.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const GET: APIRoute = async () => {
  try {
    // Sekarang kita hanya perlu mengambil data dari VIEW yang sudah cerdas
    const { data, error } = await supabaseAdmin
      .from("available_vouchers_view")
      .select("*");

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API /api/vouchers/public Error:", error);
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
};
