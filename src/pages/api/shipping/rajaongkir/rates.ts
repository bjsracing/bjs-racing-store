// File: src/pages/api/shipping/rajaongkir/rates.ts
import type { APIRoute } from "astro";

export interface RajaOngkirRate {
  service: string;
  code: string;
  name: string;
  cost: number;
  etd: string;
  description: string;
}

async function getRajaOngkirCost(params: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}): Promise<RajaOngkirRate[]> {
  const apiKey = import.meta.env.RAJAONGKIR_API_KEY;
  if (!apiKey) {
    throw new Error("RajaOngkir API key tidak dikonfigurasi.");
  }

  const urlencoded = new URLSearchParams();
  urlencoded.append("origin", params.origin);
  urlencoded.append("destination", params.destination);
  urlencoded.append("weight", String(params.weight));
  urlencoded.append("courier", params.courier.toLowerCase());

  const response = await fetch(
    "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
    {
      method: "POST",
      headers: {
        key: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded,
    },
  );

  const result = await response.json();
  if (!response.ok || result.meta.status !== "success") {
    const message =
      result?.meta?.message || `Gagal menghitung ongkos kirim untuk ${params.courier}.`;
    throw new Error(message);
  }

  const data = result.data || [];
  return data.map((item: any) => ({
    service: item.service,
    code: item.code,
    name: item.name,
    cost: Number(item.cost),
    etd: String(item.etd || ""),
    description: item.description || "",
  }));
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { destination, weight, couriers } = body;

    const origin = import.meta.env.RAJAONGKIR_ORIGIN_ID;
    if (!origin) {
      return new Response(
        JSON.stringify({ message: "RAJAONGKIR_ORIGIN_ID belum dikonfigurasi." }),
        { status: 500 },
      );
    }
    if (!destination || !weight) {
      return new Response(
        JSON.stringify({ message: "destination & weight wajib diisi." }),
        { status: 400 },
      );
    }

    const requestedCouriers = Array.isArray(couriers) && couriers.length > 0
      ? couriers
      : ["gojek", "pos"];

    const results = await Promise.allSettled(
      requestedCouriers.map((c: string) =>
        getRajaOngkirCost({
          origin,
          destination,
          weight: Number(weight),
          courier: c,
        }),
      ),
    );

    const merged: RajaOngkirRate[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        merged.push(...result.value);
      }
    });

    return new Response(JSON.stringify(merged), { status: 200 });
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
