// src/pages/api/rajaongkir/search-city.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  const query = url.searchParams.get("query");

  if (!apiKey) {
    /* ... error handling ... */
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
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    /* ... error handling ... */
  }
};
