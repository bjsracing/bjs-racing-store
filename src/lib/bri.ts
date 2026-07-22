// File: src/lib/bri.ts
// Klien BRIAPI SNAP 2.0 untuk QRIS MPM Dynamic.
// CATATAN: Skema signature & path endpoint mengikuti standar BRIAPI SNAP.
// Nilai pasti (field JSON generate-QR, format response) wajib diverifikasi
// ulang dengan dokumentasi BRIAPI resmi saat aktivasi sandbox/production.
import crypto from "crypto";

const BRI_BASE = import.meta.env.BRI_API_BASE_URL || "";
const CLIENT_ID = import.meta.env.BRI_CLIENT_ID || "";
const CLIENT_SECRET = import.meta.env.BRI_CLIENT_SECRET || "";
const PARTNER_ID = import.meta.env.BRI_QRIS_PARTNER_ID || "";
const CHANNEL_ID = import.meta.env.BRI_QRIS_CHANNEL_ID || "";
const MERCHANT_ID = import.meta.env.BRI_QRIS_MERCHANT_ID || "";
const TERMINAL_ID = import.meta.env.BRI_QRIS_TERMINAL_ID || "";
const PRIVATE_KEY = import.meta.env.BRI_PRIVATE_KEY || "";
const PUBLIC_KEY = import.meta.env.BRI_PUBLIC_KEY || "";

function briTimestamp(): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `.${p(d.getMilliseconds(), 3)}+07:00`
  );
}

function externalId(): string {
  return crypto.randomUUID();
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getBriAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 5000) {
    return tokenCache.token;
  }
  const timestamp = briTimestamp();
  const signature = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(`${CLIENT_ID}|${timestamp}`)
    .digest("base64");

  const res = await fetch(`${BRI_BASE}/v1.0/access-token/b2b`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
      "X-Partner-Id": PARTNER_ID,
      "X-External-Id": externalId(),
      "Channel-Id": CHANNEL_ID,
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BRI token gagal: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
  };
  const token = json.accessToken;
  if (!token) throw new Error("BRI token kosong");
  tokenCache = {
    token,
    expiresAt: now + (json.expiresIn || 3600) * 1000,
  };
  return token;
}

export interface GenerateQrResult {
  qrContent: string;
  qrImage: string;
  expiresAt?: string;
  partnerReferenceNo: string;
}

export async function generateBriQrMpm(params: {
  partnerReferenceNo: string;
  amount: number;
  callbackUrl: string;
}): Promise<GenerateQrResult> {
  const token = await getBriAccessToken();
  const timestamp = briTimestamp();
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${PARTNER_ID}|${timestamp}`)
    .sign(PRIVATE_KEY, "base64");

  const value = params.amount.toFixed(2);
  const res = await fetch(`${BRI_BASE}/v1.0/qr-dynamic/qr-mpm-generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
      "X-Partner-Id": PARTNER_ID,
      "X-External-Id": externalId(),
      "Channel-Id": CHANNEL_ID,
    },
    body: JSON.stringify({
      partnerReferenceNo: params.partnerReferenceNo,
      amount: { value, currency: "IDR" },
      merchantId: MERCHANT_ID,
      terminalId: TERMINAL_ID,
      callbackUrl: params.callbackUrl,
      additionalInfo: { merchantName: "BJS Racing Store" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BRI generate QR gagal: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    qrContent?: string;
    qrImage?: string;
    expiresAt?: string;
    responseCode?: string;
  };
  if (!json.qrContent) {
    throw new Error(`BRI generate QR: qrContent kosong (${json.responseCode})`);
  }
  return {
    qrContent: json.qrContent,
    qrImage: json.qrImage || "",
    expiresAt: json.expiresAt,
    partnerReferenceNo: params.partnerReferenceNo,
  };
}

export function verifyBriSignature(opts: {
  method: string;
  path: string;
  timestamp: string;
  rawBody: string;
  signature: string;
}): boolean {
  if (!PUBLIC_KEY || !opts.signature) return false;
  const bodyHash = crypto
    .createHash("sha256")
    .update(opts.rawBody)
    .digest("hex")
    .toLowerCase();
  const candidates = [
    `${opts.method.toUpperCase()}:${opts.path}:${opts.timestamp}:${bodyHash}`,
    `${opts.method.toUpperCase()}:${opts.path}:${opts.timestamp}`,
  ];
  for (const str of candidates) {
    try {
      const ok = crypto
        .createVerify("RSA-SHA256")
        .update(str)
        .verify(PUBLIC_KEY, Buffer.from(opts.signature, "base64"));
      if (ok) return true;
    } catch {
      // coba candidate berikutnya
    }
  }
  return false;
}

export const BRI_CONFIG = {
  merchantId: MERCHANT_ID,
  terminalId: TERMINAL_ID,
  partnerId: PARTNER_ID,
  callbackUrl: import.meta.env.BRI_QRIS_CALLBACK_URL || "",
};
