// File: src/pages/api/shipping/biteship/rates.ts
import type { APIRoute } from "astro";
import { getBiteshipRates } from "@/lib/biteship.ts";

export const POST: APIRoute = async (context) => {
  const { session } = context.locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }
  try {
    const body = await context.request.json();
    const destination = body.destination;
    const weight = Number(body.weight);
    if (!destination || !weight) {
      return new Response(
        JSON.stringify({ message: "destination & weight wajib diisi." }),
        { status: 400 },
      );
    }
    const options = await getBiteshipRates({
      destination: {
        latitude: destination.latitude
          ? Number(destination.latitude)
          : undefined,
        longitude: destination.longitude
          ? Number(destination.longitude)
          : undefined,
        postal_code: destination.postal_code,
      },
      weight,
    });
    return new Response(JSON.stringify(options), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil tarif kurir.",
      }),
      { status: 500 },
    );
  }
};
