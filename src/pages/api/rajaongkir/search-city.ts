// File: src/pages/api/rajaongkir/search-city.ts
// Perbaikan: Menggunakan endpoint dan header resmi dari dokumentasi Komerce.

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  const query = url.searchParams.get("query");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }
  if (!query) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    // Gunakan endpoint resmi dari dokumentasi
    const response = await fetch(
      `https://api-sandbox.collaborator.komerce.id/tariff/api/v1/destination/search?keyword=${query}`,
      {
        method: "GET",
        headers: {
          // Gunakan header 'x-api-key' yang benar
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (!response.ok || result.meta.status !== "success") {
      console.error(
        "Komerce Search API Error:",
        JSON.stringify(result, null, 2),
      );
      const errorMessage = result?.meta?.message || "Gagal mencari destinasi.";
      return new Response(JSON.stringify({ message: errorMessage }), {
        status: result.meta.code || 500,
      });
    }

    // Kembalikan data dari properti 'data'
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal memproses pencarian destinasi:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      }),
      { status: 500 },
    );
  }
};
