// File: src/lib/biteship.ts
// Klien Biteship API (rates, order, webhook verify).
import crypto from "crypto";

const BITESHIP_BASE = "https://api.biteship.com";
const API_KEY = import.meta.env.BITESHIP_API_KEY || "";
const ORIGIN_LAT = import.meta.env.BITESHIP_ORIGIN_LAT || "";
const ORIGIN_LNG = import.meta.env.BITESHIP_ORIGIN_LNG || "";
const WEBHOOK_KEY = import.meta.env.BITESHIP_WEBHOOK_KEY || "X-Biteship-Signature";
const WEBHOOK_SECRET = import.meta.env.BITESHIP_WEBHOOK_SECRET || "";

async function biteshipRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<any> {
  const res = await fetch(`${BITESHIP_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Biteship ${path} gagal: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

export interface BiteshipRateOption {
  company: string;
  courier_name: string;
  courier_service_code: string;
  courier_service_name: string;
  price: number;
  duration: string;
}

export async function getBiteshipRates(params: {
  destination: { latitude?: number; longitude?: number; postal_code?: string };
  weight: number;
  couriers?: string;
}): Promise<BiteshipRateOption[]> {
  const couriers = params.couriers || "gojek,jne,tiki,pos";
  const origin: any = { latitude: ORIGIN_LAT, longitude: ORIGIN_LNG };
  const destination: any = {};
  if (params.destination.latitude && params.destination.longitude) {
    destination.latitude = params.destination.latitude;
    destination.longitude = params.destination.longitude;
  }
  if (params.destination.postal_code) {
    destination.postal_code = params.destination.postal_code;
  }

  const json = await biteshipRequest("POST", "/v1/rates/couriers", {
    origin,
    destination,
    couriers,
    items: [
      {
        name: "Pesanan BJS Racing",
        description: "Pakaian & sparepart motor",
        length: 10,
        width: 10,
        height: 10,
        weight: Math.max(1, Math.round(params.weight)),
      },
    ],
  });

  const pricing = (json.pricing || []) as any[];
  return pricing.map((p) => ({
    company: p.company,
    courier_name: p.courier_name,
    courier_service_code: p.courier_service_code,
    courier_service_name: p.courier_service_name,
    price: p.price,
    duration: p.duration || `${p.shipment_duration_range || ""} ${p.shipment_duration_unit || ""}`.trim(),
  }));
}

export interface CreateBiteshipOrderParams {
  referenceId: string;
  origin: {
    contactName: string;
    contactPhone: string;
    latitude: number;
    longitude: number;
    address: string;
    postalCode: string;
  };
  destination: {
    contactName: string;
    contactPhone: string;
    latitude: number;
    longitude: number;
    address: string;
    postalCode: string;
  };
  courierCompany: string;
  courierType: string;
  items: { name: string; description: string; quantity: number; weight: number; value: number }[];
}

export interface BiteshipOrderResult {
  id: string;
  waybillId: string;
  trackingId: string;
  status: string;
  price: number;
}

export async function createBiteshipOrder(
  p: CreateBiteshipOrderParams,
): Promise<BiteshipOrderResult> {
  const json = await biteshipRequest("POST", "/v1/orders", {
    reference_id: p.referenceId,
    origin: {
      contact_name: p.origin.contactName,
      contact_phone: p.origin.contactPhone,
      coordinate: { latitude: p.origin.latitude, longitude: p.origin.longitude },
      address: p.origin.address,
      postal_code: p.origin.postalCode,
    },
    destination: {
      contact_name: p.destination.contactName,
      contact_phone: p.destination.contactPhone,
      coordinate: { latitude: p.destination.latitude, longitude: p.destination.longitude },
      address: p.destination.address,
      postal_code: p.destination.postalCode,
    },
    courier: { company: p.courierCompany, type: p.courierType },
    items: p.items.map((it) => ({
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      weight: Math.max(1, Math.round(it.weight)),
      value: it.value,
      length: 10,
      width: 10,
      height: 10,
    })),
  });
  return {
    id: json.id,
    waybillId: json.courier?.waybill_id || "",
    trackingId: json.courier?.tracking_id || "",
    status: json.status,
    price: json.price,
  };
}

export function verifyBiteshipWebhook(headers: Headers): boolean {
  if (!WEBHOOK_SECRET) return false;
  return headers.get(WEBHOOK_KEY) === WEBHOOK_SECRET;
}
