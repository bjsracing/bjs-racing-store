// File: /src/pages/api/payment/webhook.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import crypto from "crypto";

export const POST: APIRoute = async ({ request }) => {
    try {
        const midtransNotification = await request.json();
        const serverKey = import.meta.env.MIDTRANS_SERVER_KEY;

        const { order_id, status_code, gross_amount, signature_key } =
            midtransNotification;
        const hash = crypto
            .createHash("sha512")
            .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
            .digest("hex");

        if (hash !== signature_key) {
            console.error("Invalid Midtrans signature key received.");
            return new Response("Invalid signature.", { status: 200 });
        }

        const { transaction_status, fraud_status } = midtransNotification;

        // --- PERBAIKAN UTAMA DIMULAI DI SINI ---
        if (transaction_status == "settlement" && fraud_status == "accept") {
            // Pembayaran berhasil, jalankan proses secara berurutan

            // 1. Jalankan fungsi kritis terlebih dahulu (update status & stok)
            const { error: paymentError } = await supabaseAdmin.rpc(
                "handle_successful_payment",
                { p_order_number: order_id },
            );

            if (paymentError) {
                // Jika proses kritis gagal, catat error fatal dan hentikan.
                console.error(
                    `KRITIS: Gagal menjalankan handle_successful_payment untuk Order ID: ${order_id}. Error:`,
                    paymentError,
                );
            } else {
                // 2. Jika fungsi kritis berhasil, lanjutkan dengan fungsi logging ke POS
                console.log(
                    `[Webhook] Pembayaran inti untuk Order ID: ${order_id} berhasil. Melanjutkan ke logging POS.`,
                );

                const { error: logError } = await supabaseAdmin.rpc(
                    "log_pos_record",
                    {
                        p_order_number: order_id,
                    },
                );

                if (logError) {
                    // Jika logging gagal, ini tidak kritis. Cukup catat errornya.
                    // Status pesanan dan stok sudah benar.
                    console.error(
                        `LOGGING GAGAL: Gagal menjalankan log_pos_record untuk Order ID: ${order_id}. Error:`,
                        logError,
                    );
                } else {
                    console.log(
                        `[Webhook] Logging POS untuk Order ID: ${order_id} berhasil.`,
                    );
                }
            }
        } else if (
            transaction_status == "cancel" ||
            transaction_status == "expire" ||
            transaction_status == "deny"
        ) {
            // Pembayaran gagal atau dibatalkan (logika ini sudah benar)
            const { data: orderData } = await supabaseAdmin
                .from("orders")
                .update({ status: "cancelled" })
                .eq("order_number", order_id)
                .select("id")
                .single();

            if (orderData) {
                await supabaseAdmin
                    .from("payments")
                    .update({ status: transaction_status })
                    .eq("order_id", orderData.id);
            }
        }
        // --- AKHIR DARI PERBAIKAN ---

        return new Response("Notification successfully processed.", {
            status: 200,
        });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(
            "Error processing notification, but acknowledged.",
            { status: 200 },
        );
    }
};
