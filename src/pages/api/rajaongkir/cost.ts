// File: src/pages/api/rajaongkir/cost.ts
// Perbaikan: Menambahkan logging diagnostik untuk melihat payload yang dikirim.

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
        JSON.stringify({ message: "Data input tidak lengkap." }),
        { status: 400 },
      );
    }

    // ==================================================================
    // == INSTRUKSI DEBUGGING: Membuat payload dan mencetaknya ke log  ==
    // ==================================================================
    // 1. Buat objek payload yang akan dikirim ke RajaOngkir.
    const rajaOngkirPayload = {
      Origin: origin,
      Destination: destination,
      weight: weight,
      courier: courier.toLowerCase(),
    };

    // 2. Cetak payload ini ke log Vercel. Ini akan menunjukkan kepada kita
    //    secara pasti apa yang dikirim oleh server Anda.
    console.log(
      "[DEBUG] Payload yang dikirim ke RajaOngkir:",
      JSON.stringify(rajaOngkirPayload, null, 2),
    );
    // ==================================================================

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "content-type": "application/json",
        },
        // 3. Kirim payload yang sudah kita log.
        body: JSON.stringify(rajaOngkirPayload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RajaOngkir API Error Response:", errorText);

      // Kembalikan error yang lebih detail ke frontend untuk debugging
      return new Response(
        JSON.stringify({
          message: "API RajaOngkir merespons dengan error.",
          details: errorText, // Sertakan detail error asli
          sentPayload: rajaOngkirPayload, // Sertakan payload yang kita kirim
        }),
        { status: response.status },
      );
    }

    const result = await response.json();

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
            : "Gagal menghitung ongkos kirim.",
      }),
      { status: 500 },
    );
  }
};
