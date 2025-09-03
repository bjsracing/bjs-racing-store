// src/pages/api/test-rajaongkir.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API Key tidak ditemukan di environment Vercel.",
      }),
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/destination/province",
      {
        method: "GET",
        headers: {
          key: apiKey,
          // Tambahkan header ini untuk mencegah caching di sisi server Vercel
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );

    const responseBodyText = await response.text(); // Baca sebagai teks dulu

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Respons dari RajaOngkir tidak OK.",
          status: response.status,
          body: responseBodyText,
        }),
        { status: 500 },
      );
    }

    // Kembalikan body apa adanya agar kita bisa lihat data mentahnya
    return new Response(responseBodyText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Terjadi crash pada fungsi API.",
        message: error.message,
      }),
      { status: 500 },
    );
  }
};
