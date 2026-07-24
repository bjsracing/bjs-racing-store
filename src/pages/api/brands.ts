// File: src/pages/api/brands.ts
// API endpoint untuk mengambil data brand aktif (public)

import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const GET: APIRoute = async () => {
  try {
    const { data: brands, error } = await supabaseAdmin
      .from("brands")
      .select("id, name, logo_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(brands || []), { status: 200 });
  } catch (error) {
    console.error("Fetch brands error:", error);
    return new Response(
      JSON.stringify({ message: "Gagal memuat brand." }),
      { status: 500 },
    );
  }
};
