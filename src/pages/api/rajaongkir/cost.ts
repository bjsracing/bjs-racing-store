// File: src/pages/api/rajaongkir/cost.ts
// Versi Final dengan perbaikan struktur payload dan logging diagnostik.

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

    // Buat objek payload internal yang akan dikirim
    const rajaOngkirPayload = {
      Origin: origin,
      Destination: destination,
      weight: weight,
      courier: courier.toLowerCase(),
    };

    // Kirim permintaan ke server RajaOngkir
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "content-type": "application/json",
        },
        // Bungkus payload di dalam objek "data"
        body: JSON.stringify({ data: rajaOngkirPayload }),
      },
    );

    // Ambil respons dalam format JSON
    const result = await response.json();

    // Cek jika respons TIDAK berhasil (status bukan 2xx)
    if (!response.ok) {
      // --- FUNGSI DEBUGGING 1: Log error spesifik dari RajaOngkir ---
      console.error(
        "RajaOngkir API Error Response:",
        JSON.stringify(result, null, 2),
      );
      const errorMessage =
        result?.meta?.message || "Terjadi kesalahan dari API RajaOngkir.";
      return new Response(JSON.stringify({ message: errorMessage }), {
        status: response.status,
      });
    }

    // Jika berhasil, kembalikan data ongkos kirim
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // --- FUNGSI DEBUGGING 2: Log error umum (jaringan, dll) ---
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
