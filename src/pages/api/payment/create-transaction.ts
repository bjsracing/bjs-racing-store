// File: /src/pages/api/payment/create-transaction.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import { validateAndComputeVoucher, consumeVoucher } from "@/lib/voucher.ts";
import { generateBriQrMpm, BRI_CONFIG } from "@/lib/bri.ts";
import { sendOrderNotification } from "@/lib/notifications.ts";
import { Buffer } from "buffer";

interface FrontendCartItem {
    product_id: string;
    price: number;
    quantity: number;
    name: string;
    sku: string;
    image_url: string;
}

function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `BJS-${year}${month}${day}-${randomPart}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
    const { session } = locals;
    if (!session) {
        return new Response(
            JSON.stringify({ message: "Otentikasi diperlukan." }),
            { status: 401 },
        );
    }

    try {
        const body = await request.json();
        const {
            address_id,
            courier,
            cart_items,
            shipping_cost,
            payment_gateway_fee,
            voucher_code,
        } = body;
        const typedCartItems = cart_items as FrontendCartItem[];

        if (
            !address_id ||
            !courier ||
            !typedCartItems ||
            typedCartItems.length === 0
        ) {
            return new Response(
                JSON.stringify({ message: "Data checkout tidak lengkap." }),
                { status: 400 },
            );
        }

        // Blok validasi stok (tidak berubah)
        const productIds = typedCartItems.map((item) => item.product_id);
        const { data: productsInStock, error: stockCheckError } =
            await supabaseAdmin
                .from("products")
                .select("id, nama, stok")
                .in("id", productIds);
        if (stockCheckError)
            throw new Error("Gagal memverifikasi stok produk.");
        for (const item of typedCartItems) {
            const product = productsInStock.find(
                (p) => p.id === item.product_id,
            );
            if (!product || item.quantity > product.stok) {
                return new Response(
                    JSON.stringify({
                        message: `Stok untuk produk "${item.name}" tidak mencukupi. Sisa stok: ${product?.stok || 0}. Silakan perbarui keranjang Anda.`,
                    }),
                    { status: 409 },
                );
            }
        }

        const { data: customer, error: customerError } = await supabaseAdmin
            .from("customers")
            .select("id, nama_pelanggan, telepon")
            .eq("auth_user_id", session.user.id)
            .single();
        if (customerError) throw new Error("Profil pelanggan tidak ditemukan.");

        const { data: address, error: addressError } = await supabaseAdmin
            .from("customer_addresses")
            .select("*")
            .eq("id", address_id)
            .eq("customer_id", customer.id)
            .single();
        if (addressError) throw new Error("Alamat pengiriman tidak valid.");

        // --- PERBAIKAN 2: Perbarui kalkulasi total untuk menyertakan semua biaya & diskon ---
        const subtotalProducts = typedCartItems.reduce(
            (acc: number, item: FrontendCartItem) =>
                acc + item.price * item.quantity,
            0,
        );
        const finalShippingCost = Number(shipping_cost) || 0;
        const finalPaymentGatewayFee = Number(payment_gateway_fee) || 0;

        // --- PERBAIKAN KEAMANAN: Jangan percaya discount_amount dari client.
        // Hitung ulang diskon di server berdasarkan voucher_code. ---
        let finalDiscountAmount = 0;
        let appliedVoucherId: string | null = null;
        if (voucher_code) {
            const cartProductIds = typedCartItems.map(
                (item: FrontendCartItem) => item.product_id,
            );
            const voucherResult = await validateAndComputeVoucher(
                voucher_code,
                customer.id,
                subtotalProducts,
                finalShippingCost,
                cartProductIds,
            );
            if (!voucherResult.valid) {
                return new Response(
                    JSON.stringify({ message: voucherResult.message }),
                    { status: 400 },
                );
            }
            finalDiscountAmount = voucherResult.discount_amount || 0;
            appliedVoucherId = voucherResult.voucher?.id ?? null;
        }

        const totalAmount =
            subtotalProducts +
            finalShippingCost +
            finalPaymentGatewayFee -
            finalDiscountAmount;

        const orderNumber = generateOrderNumber();
        const { data: newOrder, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
                order_number: orderNumber,
                customer_id: customer.id,
                total_amount: totalAmount,
                shipping_cost: finalShippingCost,
                subtotal_products: subtotalProducts,
                service_fee: 0,
                payment_gateway_fee: finalPaymentGatewayFee,
                voucher_code: voucher_code, // <-- Simpan kode voucher
                discount_amount: finalDiscountAmount, // <-- Simpan jumlah diskon
                shipping_address: address,
                courier_details: courier,
                status: "awaiting_payment",
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Tandai voucher sudah dipakai & naikkan usage_count agar tidak bisa dipakai ulang.
        // Dilakukan setelah order berhasil dibuat.
        if (appliedVoucherId) {
            await consumeVoucher(customer.id, appliedVoucherId);
        }

        const orderItemsData = typedCartItems.map((item: FrontendCartItem) => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_snapshot: {
                name: item.name,
                sku: item.sku,
                image_url: item.image_url,
            },
        }));

        const { error: orderItemsError } = await supabaseAdmin
            .from("order_items")
            .insert(orderItemsData);
        if (orderItemsError) throw orderItemsError;

        const paymentGateway = (
            import.meta.env.PAYMENT_GATEWAY || "midtrans"
        ).toLowerCase();

        if (paymentGateway === "bri") {
            const qr = await generateBriQrMpm({
                partnerReferenceNo: orderNumber,
                amount: totalAmount,
                callbackUrl: BRI_CONFIG.callbackUrl,
            });
            await supabaseAdmin.from("payments").insert({
                order_id: newOrder.id,
                gateway: "bri",
                payment_reference: qr.qrContent,
                amount: totalAmount,
                status: "pending",
            });
            return new Response(
                JSON.stringify({
                    qr_content: qr.qrContent,
                    qr_image_base64: qr.qrImage,
                    expires_at: qr.expiresAt,
                    order_id: newOrder.id,
                }),
                { status: 200 },
            );
        }

        const midtransServerKey = import.meta.env.MIDTRANS_SERVER_KEY;
        const authString = Buffer.from(`${midtransServerKey}:`).toString(
            "base64",
        );

        const item_details = typedCartItems.map((item: FrontendCartItem) => ({
            id: item.product_id,
            price: item.price,
            quantity: item.quantity,
            name: item.name.substring(0, 50),
        }));
        if (finalShippingCost > 0) {
            item_details.push({
                id: "SHIPPING",
                price: finalShippingCost,
                quantity: 1,
                name: `Ongkos Kirim (${courier.name} - ${courier.service})`,
            });
        }
        if (finalPaymentGatewayFee > 0) {
            item_details.push({
                id: "PAYMENT_GATEWAY_FEE",
                price: finalPaymentGatewayFee,
                quantity: 1,
                name: "Biaya Layanan Transaksi",
            });
        }

        if (finalDiscountAmount > 0) {
            item_details.push({
                id: `DISCOUNT_${voucher_code}`,
                price: -finalDiscountAmount,
                quantity: 1,
                name: `Diskon (${voucher_code})`,
            });
        }

        let enabled_payments = [
            "bca_va",
            "bni_va",
            "bri_va",
            "permata_va",
            "cimb_va",
            "other_va",
        ];

        if (finalPaymentGatewayFee > 0) {
            const qrisFee = totalAmount * 0.007;
            const gopayFee = totalAmount * 0.02;
            const shopeepayFee = totalAmount * 0.02;
            const danaFee = totalAmount * 0.01665;
            const ovoFee = totalAmount * 0.01665;
            if (qrisFee <= finalPaymentGatewayFee) enabled_payments.push("other_qris");
            if (gopayFee <= finalPaymentGatewayFee) enabled_payments.push("gopay");
            if (shopeepayFee <= finalPaymentGatewayFee) enabled_payments.push("shopeepay");
            if (danaFee <= finalPaymentGatewayFee) enabled_payments.push("dana");
            if (ovoFee <= finalPaymentGatewayFee) enabled_payments.push("ovo");
        }

        const midtransPayload = {
            transaction_details: {
                order_id: orderNumber,
                gross_amount: totalAmount,
            },
            item_details: item_details,
            enabled_payments: enabled_payments,
            customer_details: {
                first_name: customer.nama_pelanggan,
                phone: customer.telepon,
                email: session.user.email,
                shipping_address: {
                    first_name: address.recipient_name,
                    phone: address.recipient_phone,
                    address: address.full_address,
                    city: address.destination_text.split(",")[0],
                    postal_code: address.postal_code,
                    country_code: "IDN",
                },
            },
        };

        const midtransResponse = await fetch(
            "https://app.sandbox.midtrans.com/snap/v1/transactions",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Basic ${authString}`,
                },
                body: JSON.stringify(midtransPayload),
            },
        );

        const midtransResult = await midtransResponse.json();
        if (!midtransResponse.ok) {
            throw new Error(
                `Midtrans Error: ${JSON.stringify(midtransResult)}`,
            );
        }

        await supabaseAdmin
            .from("payments")
            .insert({
                order_id: newOrder.id,
                midtrans_transaction_id: midtransResult.token,
                amount: totalAmount,
                status: "pending",
            });

        void sendOrderNotification({
          to: customer.telepon,
          channel: "whatsapp",
          event: "order_created",
          data: {
            orderNumber: newOrder.order_number,
            customerName: customer.nama_pelanggan,
            amount: totalAmount,
            storeName: "BJS Racing Store",
            storePhone: "0881011669213",
          },
        }).catch((err: unknown) => console.error("Gagal kirim notifikasi order_created:", err));

        return new Response(
            JSON.stringify({
                snap_token: midtransResult.token,
                order_id: newOrder.id,
            }),
            { status: 200 },
        );
    } catch (error) {
        let errorMessage = "Terjadi kesalahan pada server.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Create Transaction API Error:", error);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};
