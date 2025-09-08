// File: src/pages/api/rajaongkir/cost.ts
// Perbaikan Final: Menggunakan metode GET dan parameter sesuai dokumentasi resmi Komerce.

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }

  try {
    // 1. Ambil semua parameter dari body request frontend
    const body = await request.json();
    const {
      shipper_destination_id,
      receiver_destination_id,
      weight,
      item_value,
      origin_pin_point,
      destination_pin_point,
    } = body;

    // 2. Validasi parameter wajib untuk semua kurir
    if (
      !shipper_destination_id ||
      !receiver_destination_id ||
      !weight ||
      !item_value
    ) {
      return new Response(
        JSON.stringify({
          message:
            "Parameter origin, destination, weight, dan item_value wajib diisi.",
        }),
        { status: 400 },
      );
    }

    // 3. Bangun URL dengan URLSearchParams untuk request GET
    const endpoint =
      "https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate";
    const params = new URLSearchParams({
      shipper_destination_id: shipper_destination_id,
      receiver_destination_id: receiver_destination_id,
      weight: String(weight),
      item_value: String(item_value),
    });

    // Tambahkan parameter pin point HANYA jika ada (penting untuk GoSend)
    if (origin_pin_point && destination_pin_point) {
      params.append("origin_pin_point", origin_pin_point);
      params.append("destination_pin_point", destination_pin_point);
    }

    const url = `${endpoint}?${params.toString()}`;

    // Debug log removed for production

    // 4. Lakukan request GET dengan header yang benar
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok || result.meta.status !== "success") {
      console.error(
        "Komerce Calculate API Error:",
        JSON.stringify(result, null, 2),
      );
      const errorMessage =
        result?.meta?.message || "Gagal menghitung ongkos kirim.";
      return new Response(JSON.stringify({ message: errorMessage }), {
        status: result.meta.code || 500,
      });
    }

    // 5. Kembalikan data dari properti 'data'
    return new Response(JSON.stringify(result.data || {}), {
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
