// File: src/pages/api/rajaongkir/cost.ts
// Perbaikan: Ubah case sensitivity field 'origin' -> 'Origin' dan 'destination' -> 'Destination'.

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
          message: "Data origin, destination, weight, dan courier wajib diisi.",
        }),
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          // --- PERBAIKAN DI SINI ---
          Origin: origin, // 'o' menjadi 'O'
          Destination: destination, // 'd' menjadi 'D'
          weight: weight,
          courier: courier.toLowerCase(),
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RajaOngkir API Error:", errorText);
      throw new Error(`Error dari API RajaOngkir: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal menghitung ongkos kirim:", error);
    return new Response(
      // Mengirim pesan error yang lebih spesifik jika memungkinkan
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkos kirim.",
      }),
      { status: 500 },
    );
  }
};
