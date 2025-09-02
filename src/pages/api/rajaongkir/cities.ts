// src/pages/api/rajaongkir/cities.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  // Sesuai frontend, kita menggunakan 'province' sebagai nama parameter
  const provinceId = url.searchParams.get("province");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "RajaOngkir API key tidak dikonfigurasi." }),
      { status: 500 },
    );
  }

  if (!provinceId) {
    return new Response(
      JSON.stringify({ message: "ID Provinsi wajib diisi." }),
      { status: 400 },
    );
  }

  try {
    // Menggunakan endpoint baru dengan query parameter `province_id`
    const response = await fetch(
      `https://rajaongkir.komerce.id/api/v1/destination/city?province_id=${provinceId}`,
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

    // Mengembalikan data dari properti 'data'
    return new Response(JSON.stringify(result.data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gagal mengambil data kota:", error);
    return new Response(
      JSON.stringify({ message: "Gagal mengambil data kota dari RajaOngkir." }),
      { status: 500 },
    );
  }
};
