// File: /src/pages/api/payment/webhook.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import crypto from "crypto";

export const POST: APIRoute = async ({ request }) => {
    try {
        const midtransNotification = await request.json();
        const serverKey = import.meta.env.MIDTRANS_SERVER_KEY;

        // --- 1. Verifikasi Keamanan (Signature Key) ---
        const { order_id, status_code, gross_amount, signature_key } =
            midtransNotification;
        const hash = crypto
            .createHash("sha512")
            .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
            .digest("hex");

        if (hash !== signature_key) {
            console.error("Invalid Midtrans signature key.");
            return new Response("Invalid signature", { status: 401 });
        }

        // --- 2. Proses Notifikasi Berdasarkan Status Transaksi ---
        const { transaction_status, fraud_status } = midtransNotification;

        if (transaction_status == "settlement") {
            // Pembayaran berhasil
            if (fraud_status == "accept") {
                // Panggil fungsi database untuk menangani semua update
                const { error } = await supabaseAdmin.rpc(
                    "handle_successful_payment",
                    {
                        p_order_number: order_id,
                    },
                );
                if (error) {
                    console.error(
                        "Error calling handle_successful_payment:",
                        error,
                    );
                    // Tetap kirim 200 OK agar Midtrans tidak retry
                }
            }
        } else if (
            transaction_status == "cancel" ||
            transaction_status == "expire" ||
            transaction_status == "deny"
        ) {
            // Pembayaran gagal atau dibatalkan
            await supabaseAdmin
                .from("orders")
                .update({ status: "cancelled" })
                .eq("order_number", order_id);
        }

        // --- 3. Kirim Respons ke Midtrans ---
        // Selalu kirim 200 OK agar Midtrans berhenti mengirim notifikasi untuk transaksi ini.
        return new Response("Notification received", { status: 200 });
    } catch (error) {
        console.error("Webhook processing error:", error);
        // Tetap kirim 200 OK, tapi catat error di server Anda
        return new Response(
            "Error processing notification, but acknowledged.",
            { status: 200 },
        );
    }
};
