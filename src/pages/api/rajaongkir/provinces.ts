// src/pages/api/rajaongkir/provinces.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "RajaOngkir API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/destination/province",
      {
        method: "GET",
        headers: { key: apiKey },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RajaOngkir API Error:", errorText);
      throw new Error(`Error dari API RajaOngkir: ${response.statusText}`);
    }

    const result = await response.json();

    // Mengembalikan data dari properti 'data' sesuai struktur respons baru
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal mengambil data provinsi:", error);
    return new Response(
      JSON.stringify({
        message: "Gagal mengambil data provinsi dari RajaOngkir.",
      }),
      { status: 500 },
    );
  }
};
