// src/pages/api/rajaongkir/provinces.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response("RajaOngkir API key is not configured.", {
      status: 500,
    });
  }

  try {
    const response = await fetch(
      "https://api.rajaongkir.com/starter/province",
      {
        method: "GET",
        headers: {
          key: apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`RajaOngkir API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to fetch provinces from RajaOngkir.", {
      status: 500,
    });
  }
};
