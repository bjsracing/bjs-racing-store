// File: src/pages/api/shipping/biteship/geocode.ts
// Best-effort geocoding alamat -> koordinat via Biteship Map Search.
// Jika Biteship tidak mengembalikan koordinat, frontend tetap bisa
// mengisi latitude/longitude secara manual.
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { session } = context.locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }
  const q = context.url.searchParams.get("q") || "";
  if (!q) {
    return new Response(
      JSON.stringify({ message: "Parameter q wajib diisi." }),
      { status: 400 },
    );
  }
  try {
    const apiKey = import.meta.env.BITESHIP_API_KEY || "";
    const res = await fetch(
      `https://api.biteship.com/v1/maps/areas?input=${encodeURIComponent(q)}&limit=1`,
      { headers: { Authorization: apiKey } },
    );
    const json = await res.json().catch(() => ({}));
    const areas = json.areas || json.data || [];
    const first = areas[0];
    if (first && first.latitude && first.longitude) {
      return new Response(
        JSON.stringify({
          latitude: Number(first.latitude),
          longitude: Number(first.longitude),
        }),
        { status: 200 },
      );
    }
    return new Response(
      JSON.stringify({ latitude: null, longitude: null }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ latitude: null, longitude: null }),
      { status: 200 },
    );
  }
};
