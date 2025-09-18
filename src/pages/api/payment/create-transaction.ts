// File: /src/pages/api/payment/create-transaction.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
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
        // --- PERBAIKAN 1: Terima 'service_fee' dari frontend ---
        const { address_id, courier, cart_items, shipping_cost, service_fee } =
            body;
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

        // --- PERBAIKAN 2: Perbarui kalkulasi total untuk menyertakan semua biaya ---
        const subtotalProducts = typedCartItems.reduce(
            (acc: number, item: FrontendCartItem) =>
                acc + item.price * item.quantity,
            0,
        );
        const finalShippingCost = Number(shipping_cost) || 0;
        const finalServiceFee = Number(service_fee) || 0;
        const totalAmount =
            subtotalProducts + finalShippingCost + finalServiceFee;

        const orderNumber = generateOrderNumber();
        const { data: newOrder, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
                order_number: orderNumber,
                customer_id: customer.id,
                total_amount: totalAmount,
                shipping_cost: finalShippingCost,
                subtotal_products: subtotalProducts,
                service_fee: finalServiceFee, // <-- Simpan biaya layanan ke DB
                shipping_address: address,
                courier_details: courier,
                status: "awaiting_payment",
            })
            .select()
            .single();

        if (orderError) throw orderError;

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

        const midtransServerKey = import.meta.env.MIDTRANS_SERVER_KEY;
        const authString = Buffer.from(`${midtransServerKey}:`).toString(
            "base64",
        );

        // --- PERBAIKAN 3: Siapkan item_details yang lengkap untuk Midtrans ---
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

        if (finalServiceFee > 0) {
            item_details.push({
                id: "SERVICE_FEE",
                price: finalServiceFee,
                quantity: 1,
                name: "Biaya Layanan",
            });
        }

        // --- PERBAIKAN 4: Terapkan logika pembatasan metode pembayaran ---
        let enabled_payments = [
            "bca_va",
            "bni_va",
            "bri_va",
            "permata_va",
            "cimb_va",
            "other_va",
        ]; // Default: Hanya Transfer Bank

        if (totalAmount <= 572000) {
            enabled_payments.push("other_qris");
        }

        const midtransPayload = {
            transaction_details: {
                order_id: orderNumber,
                gross_amount: totalAmount,
            },
            item_details: item_details,
            enabled_payments: enabled_payments, // <-- Sertakan daftar pembayaran yang diizinkan
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

        await supabaseAdmin.from("payments").insert({
            order_id: newOrder.id,
            midtrans_transaction_id: midtransResult.token,
            amount: totalAmount,
            status: "pending",
        });

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
