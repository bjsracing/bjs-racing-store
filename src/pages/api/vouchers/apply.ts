// File: /src/pages/api/vouchers/apply.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import { validateAndComputeVoucher } from "@/lib/voucher.ts";

export const POST: APIRoute = async ({ request, locals }) => {
    const { session } = locals;
    if (!session)
        return new Response(
            JSON.stringify({ message: "Otentikasi diperlukan." }),
            { status: 401 },
        );

    try {
        const { voucher_code, cart_subtotal, shipping_cost, cart_items } =
            await request.json();

        if (!voucher_code || cart_subtotal === undefined)
            throw new Error("Kode voucher dan subtotal keranjang diperlukan.");

        const { data: customer } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("auth_user_id", session.user.id)
            .single();
        if (!customer) throw new Error("Profil customer tidak ditemukan.");

        // Ambil id produk dari keranjang untuk pemeriksaan target voucher
        const cartProductIds: string[] = Array.isArray(cart_items)
            ? cart_items.map((i: any) => i.product_id).filter(Boolean)
            : [];

        const result = await validateAndComputeVoucher(
            voucher_code,
            customer.id,
            Number(cart_subtotal) || 0,
            Number(shipping_cost) || 0,
            cartProductIds,
        );

        if (!result.valid) throw new Error(result.message);

        const response = {
            success: true,
            message: "Voucher berhasil diterapkan!",
            discount_amount: result.discount_amount,
            voucher_details: {
                id: result.voucher!.id,
                code: result.voucher!.code,
                type: result.voucher!.type,
                description: result.voucher!.description,
                target_label: result.target_label ?? null,
            },
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
