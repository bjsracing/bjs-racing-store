// src/pages/api/test-rajaongkir.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API Key tidak ditemukan di environment Vercel.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/destination/province",
      {
        method: "GET",
        headers: {
          key: apiKey,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    const responseBodyText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Respons dari RajaOngkir tidak OK.",
          status: response.status,
          body: responseBodyText,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(responseBodyText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ✅ PERBAIKAN ADA DI SINI
    // Kita periksa dulu apakah 'error' adalah sebuah instance dari Error
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Terjadi crash pada fungsi API.",
          message: error.message, // Sekarang aman untuk mengakses .message
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    // Fallback jika error bukan instance dari Error
    return new Response(
      JSON.stringify({
        error: "Terjadi crash pada fungsi API dengan tipe error tidak dikenal.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
