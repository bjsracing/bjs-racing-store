// File: src/pages/api/maps/reverse-geocode.ts
// Reverse geocode lat/lng -> address components via Nominatim.
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const lat = context.url.searchParams.get("lat");
  const lng = context.url.searchParams.get("lng");
  if (!lat || !lng) {
    return new Response(JSON.stringify({ message: "lat dan lng wajib diisi." }), {
      status: 400,
    });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&accept-language=id`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BJS-Racing-Store/1.0",
        "Accept-Language": "id",
      },
    });
    const data = await res.json();
    const addr = data.address || {};

    const fullAddress = [
      addr.road || addr.building || "",
      addr.suburb || addr.district || "",
      addr.city || addr.town || addr.county || "",
      addr.state || "",
      addr.postcode || "",
    ]
      .filter(Boolean)
      .join(", ");

    return new Response(
      JSON.stringify({
        display_name: data.display_name || fullAddress,
        full_address: fullAddress,
        city: addr.city || addr.town || "",
        province: addr.state || "",
        postal_code: addr.postcode || "",
        district: addr.district || addr.suburb || "",
        subdistrict: addr.suburb || addr.district || "",
        lat: Number(lat),
        lng: Number(lng),
      }),
      { status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Gagal reverse geocode." }),
      { status: 500 },
    );
  }
};
