// File: src/pages/api/rajaongkir/cost.ts
// Perbaikan Final: Disesuaikan 100% dengan dokumentasi RajaOngkir Starter API.

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "RajaOngkir API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    if (!origin || !destination || !weight || !courier) {
      return new Response(
        JSON.stringify({
          message:
            "Parameter origin, destination, weight, dan courier wajib diisi.",
        }),
        { status: 400 },
      );
    }

    // --- PERBAIKAN 1: Gunakan URLSearchParams untuk format x-www-form-urlencoded ---
    const urlencoded = new URLSearchParams();
    urlencoded.append("origin", origin);
    urlencoded.append("destination", destination);
    urlencoded.append("weight", String(weight));
    urlencoded.append("courier", courier.toLowerCase());

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
      {
        method: "POST", // Metode yang benar adalah POST
        headers: {
          // --- PERBAIKAN 2: Gunakan header yang benar ---
          key: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlencoded, // Kirim body dalam format form-urlencoded
      },
    );

    const result = await response.json();

    if (!response.ok || result.meta.status !== "success") {
      console.error(
        "RajaOngkir Cost API Error:",
        JSON.stringify(result, null, 2),
      );
      const errorMessage =
        result?.meta?.message ||
        "Gagal menghitung ongkos kirim dari RajaOngkir.";
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
    console.error("Gagal memproses permintaan ongkos kirim:", error);
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
