// File: src/pages/api/rajaongkir/search-city.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  const query = url.searchParams.get("query");

  if (!apiKey) {
    return new Response(JSON.stringify({ message: "API key missing" }), {
      status: 500,
    });
  }
  if (!query) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    const response = await fetch(
      `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${query}`,
      {
        method: "GET",
        headers: { key: apiKey },
      },
    );
    if (!response.ok) throw new Error("RajaOngkir search API error");

    const result = await response.json();

    // ==================================================================
    // == TAMBAHKAN LOGGING DI SINI UNTUK MELIHAT STRUKTUR DATA MENTAH ==
    // ==================================================================
    if (result.data && result.data.length > 0) {
      console.log(
        "[DEBUG] Struktur Data Mentah RajaOngkir:",
        JSON.stringify(result.data[0], null, 2),
      );
    }
    // ==================================================================

    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal mengambil data RajaOngkir:", error.message);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
};
