// src/pages/api/rajaongkir/cities.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  const provinceId = url.searchParams.get("province");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "API Key Vercel tidak ditemukan." }),
      { status: 500 },
    );
  }
  if (!provinceId) {
    return new Response(
      JSON.stringify({ message: "ID Provinsi tidak diterima dari frontend." }),
      { status: 400 },
    );
  }

  try {
    const targetUrl = `https://rajaongkir.komerce.id/api/v1/destination/city?province=${provinceId}`;
    console.log(`[BJS DEBUG] Memanggil URL RajaOngkir: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { key: apiKey },
    });

    // -- BLOK DEBUGGING UTAMA --
    if (!response.ok) {
      // Jika respons dari RajaOngkir adalah error, kita tangkap semuanya.
      const errorBodyText = await response.text(); // Baca error sebagai teks
      console.error("RAW ERROR DARI RAJAONGKIR:", errorBodyText);

      // Kembalikan semua informasi ini ke frontend
      return new Response(
        JSON.stringify({
          message: "Respons dari RajaOngkir tidak OK.",
          rajaOngkirStatus: response.status,
          rajaOngkirStatusText: response.statusText,
          rajaOngkirResponseBody: errorBodyText,
        }),
        { status: 500 },
      );
    }
    // -- AKHIR BLOK DEBUGGING --

    const result = await response.json();
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fungsi API Crash:", error);
    return new Response(
      JSON.stringify({
        message: "Fungsi API /api/rajaongkir/cities.ts mengalami crash.",
        errorDetails: error.message,
      }),
      { status: 500 },
    );
  }
};
