// File: /src/pages/api/vouchers/public.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .gt("valid_until", new Date().toISOString()) // Cek belum kedaluwarsa
      .or("usage_limit.is.null,usage_count.lt.usage_limit"); // Cek kuota masih ada

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      status: 500,
    });
  }
};
