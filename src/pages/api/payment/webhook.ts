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

        if (transaction_status == "settlement" && fraud_status == "accept") {
            // --- BAGIAN KRITIS ---
            // Panggil fungsi stabil yang hanya mengurus status & stok produk
            const { error: paymentError } = await supabaseAdmin.rpc(
                "handle_successful_payment",
                {
                    p_order_number: order_id,
                },
            );

            if (paymentError) {
                // Jika proses kritis ini gagal, catat sebagai error fatal.
                console.error(
                    `KRITIS: Gagal memproses pembayaran inti untuk Order ID: ${order_id}. Error:`,
                    paymentError,
                );
                // Kita tetap return 200 agar Midtrans tidak retry, tapi ini butuh perhatian manual.
                return new Response(
                    "Critical payment processing failed but acknowledged.",
                    { status: 200 },
                );
            }

            // --- BAGIAN PENCATATAN (LOGGING) KE POS ---
            // Dibungkus try...catch agar kegagalan di sini tidak menghentikan respons 200 ke Midtrans
            try {
                console.log(
                    `[LOGGING] Memulai pencatatan ke POS untuk Order ID: ${order_id}`,
                );

                // 1. Ambil data order yang sudah diupdate, beserta item dan detail produk terkait
                const { data: orderData, error: orderFetchError } =
                    await supabaseAdmin
                        .from("orders")
                        .select("*, order_items(*, products(*))")
                        .eq("order_number", order_id)
                        .single();

                if (orderFetchError) throw orderFetchError;
                if (!orderData)
                    throw new Error(
                        "Order tidak ditemukan untuk proses logging.",
                    );

                // 2. Siapkan data untuk tabel 'stock_logs'
                const stockLogEntries = orderData.order_items.map((item) => {
                    if (!item.products)
                        throw new Error(
                            `Produk dengan ID ${item.product_id} tidak ditemukan untuk item pesanan ${item.id}`,
                        );
                    return {
                        product_id: item.product_id,
                        perubahan: -item.quantity,
                        keterangan: `Penjualan Online - Order #${orderData.order_number}`,
                    };
                });

                // 3. Masukkan ke 'stock_logs'
                const { error: stockLogError } = await supabaseAdmin
                    .from("stock_logs")
                    .insert(stockLogEntries);
                if (stockLogError) throw stockLogError;
                console.log(
                    `[LOGGING] Berhasil mencatat ${stockLogEntries.length} item ke stock_logs.`,
                );

                // 4. Hitung total laba dan siapkan data 'items' untuk 'transactions'
                let total_laba = 0;
                const transactionItemsJson = orderData.order_items.map(
                    (item) => {
                        const laba_item =
                            (item.price - item.products.harga_beli) *
                            item.quantity;
                        total_laba += laba_item;
                        return {
                            id: item.products.id,
                            nama: item.products.nama,
                            kode: item.products.kode,
                            quantity: item.quantity,
                            harga_jual: item.price,
                            harga_beli: item.products.harga_beli,
                        };
                    },
                );

                // 5. Masukkan ke tabel 'transactions'
                const { error: transactionError } = await supabaseAdmin
                    .from("transactions")
                    .insert({
                        customer_id: orderData.customer_id,
                        total: orderData.total_amount,
                        diskon: 0,
                        total_akhir: orderData.total_amount,
                        bayar: orderData.total_amount,
                        kembalian: 0,
                        items: transactionItemsJson,
                        total_laba: total_laba,
                        status_pembayaran: "Lunas",
                        sisa_hutang: 0,
                        invoice_number: orderData.order_number,
                    });
                if (transactionError) throw transactionError;
                console.log(
                    `[LOGGING] Berhasil mencatat ke tabel transactions.`,
                );
            } catch (logError) {
                console.error(
                    `NON-KRITIS: Gagal melakukan pencatatan POS untuk Order ID: ${order_id}. Error:`,
                    logError,
                );
            }
        } else if (["cancel", "expire", "deny"].includes(transaction_status)) {
            // Logika pembatalan tidak berubah, sudah benar
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
