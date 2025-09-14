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
            // --- PENYEMPURNAAN 1: Tetap kirim 200 agar Midtrans tidak retry ---
            return new Response("Invalid signature.", { status: 200 });
        }

        const { transaction_status, fraud_status } = midtransNotification;

        if (transaction_status == "settlement" && fraud_status == "accept") {
            // Pembayaran berhasil
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
            }
        } else if (
            transaction_status == "cancel" ||
            transaction_status == "expire" ||
            transaction_status == "deny"
        ) {
            // Pembayaran gagal atau dibatalkan
            const { data: orderData } = await supabaseAdmin
                .from("orders")
                .update({ status: "cancelled" })
                .eq("order_number", order_id)
                .select("id")
                .single();

            // --- PENYEMPURNAAN 2: Update juga tabel payments ---
            if (orderData) {
                await supabaseAdmin
                    .from("payments")
                    .update({ status: transaction_status })
                    .eq("order_id", orderData.id);
            }
        }

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
