// File: /src/pages/api/shipping/track.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "RajaOngkir API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }

  // 1. Ambil nomor resi (awb) dan kurir dari parameter URL
  const awb = url.searchParams.get("awb");
  const courier = url.searchParams.get("courier");

  if (!awb || !courier) {
    return new Response(
      JSON.stringify({ message: "Parameter 'awb' dan 'courier' wajib diisi." }),
      { status: 400 },
    );
  }

  try {
    // 2. Siapkan body untuk dikirim ke RajaOngkir
    const urlencoded = new URLSearchParams();
    urlencoded.append("awb", awb);
    urlencoded.append("courier", courier);

    // 3. Kirim permintaan ke RajaOngkir
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/track/waybill",
      {
        method: "POST",
        headers: {
          key: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlencoded.toString(),
      },
    );

    const result = await response.json();

    if (!response.ok || result.meta.status !== "success") {
      console.error("RajaOngkir Tracking API Error:", result);
      const errorMessage =
        result?.meta?.message || "Gagal melacak resi dari RajaOngkir.";
      return new Response(JSON.stringify({ message: errorMessage }), {
        status: response.status,
      });
    }

    // 4. Kembalikan data pelacakan yang berhasil ke frontend
    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal memproses permintaan pelacakan:", error);
    return new Response(
      JSON.stringify({
        message: (error as Error).message || "Terjadi kesalahan pada server.",
      }),
      { status: 500 },
    );
  }
};
