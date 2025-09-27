// File: /src/pages/api/vouchers/apply.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";

export const POST: APIRoute = async ({ request, locals }) => {
    const { session } = locals;
    if (!session)
        return new Response(
            JSON.stringify({ message: "Otentikasi diperlukan." }),
            { status: 401 },
        );

    try {
        const { voucher_code, cart_subtotal } = await request.json();
        if (!voucher_code || cart_subtotal === undefined)
            throw new Error("Kode voucher dan subtotal keranjang diperlukan.");

        const { data: customer } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("auth_user_id", session.user.id)
            .single();
        if (!customer) throw new Error("Profil customer tidak ditemukan.");

        // Cari voucher berdasarkan kodenya
        const { data: voucher, error: voucherError } = await supabaseAdmin
            .from("vouchers")
            .select("*")
            .eq("code", voucher_code.toUpperCase())
            .single();

        if (voucherError) throw new Error("Kode voucher tidak ditemukan.");

        // Lakukan semua validasi
        if (!voucher.is_active)
            throw new Error("Voucher ini sudah tidak aktif.");
        if (new Date(voucher.valid_until) < new Date())
            throw new Error("Voucher ini sudah kedaluwarsa.");
        if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit)
            throw new Error("Kuota voucher ini sudah habis.");
        if (cart_subtotal < voucher.min_purchase)
            throw new Error(
                `Minimal pembelian untuk voucher ini adalah Rp ${voucher.min_purchase}.`,
            );

        // Cek apakah pengguna memiliki voucher ini dan belum digunakan
        const { data: customerVoucher, error: cvError } = await supabaseAdmin
            .from("customer_vouchers")
            .select("id")
            .eq("customer_id", customer.id)
            .eq("voucher_id", voucher.id)
            .eq("is_used", false)
            .maybeSingle();

        if (cvError || !customerVoucher)
            throw new Error(
                "Anda tidak memiliki voucher ini atau sudah digunakan.",
            );

        // Jika semua valid, hitung diskonnya
        let discount_amount = 0;
        if (voucher.type === "fixed_amount") {
            discount_amount = voucher.discount_value;
        } else if (voucher.type === "percentage") {
            let calculated_discount =
                cart_subtotal * (voucher.discount_value / 100);
            discount_amount = Math.min(
                calculated_discount,
                voucher.max_discount || calculated_discount,
            );
        }

        const response = {
            success: true,
            message: "Voucher berhasil diterapkan!",
            discount_amount: Math.round(discount_amount),
            voucher_details: voucher,
        };

        return new Response(JSON.stringify(response), { status: 200 });
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: (error as Error).message,
            }),
            { status: 400 },
        );
    }
};
