// File: src/pages/api/cart.ts
// Perbaikan Final: Menambahkan Tipe Data eksplisit untuk mengatasi semua error TypeScript.

import type { APIRoute, APIContext } from "astro"; // PERBAIKAN: Impor APIContext
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// --- Fungsi Helper ---

function createSupabaseClient(cookies: APIContext["cookies"]) {
    return createServerClient(
        import.meta.env.PUBLIC_SUPABASE_URL!,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(key: string) {
                    return cookies?.get(key)?.value;
                },
                set(key: string, value: string, options: CookieOptions) {
                    cookies?.set(key, value, options);
                },
                remove(key: string, options: CookieOptions) {
                    cookies?.delete(key, options);
                },
            },
        },
    );
}

async function getCustomerIdFromSession(
    supabase: ReturnType<typeof createSupabaseClient>,
): Promise<string> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Otentikasi diperlukan.");

    const { data: customerData, error } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error)
        throw new Error(`Database error saat mencari profil: ${error.message}`);
    if (!customerData)
        throw new Error(
            "Profil pelanggan tidak ditemukan untuk pengguna yang login.",
        );

    return customerData.id;
}

// =================================================================
// == FUNGSI GET: Mengambil isi keranjang belanja pengguna        ==
// =================================================================
// PERBAIKAN: Tambahkan tipe APIContext ke parameter
export const GET: APIRoute = async ({ cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);

        const { data: cartItems, error } = await supabase
            .from("cart_items")
            .select(
                `
        quantity,
        product:products (*)
      `,
            )
            .eq("customer_id", customerId);

        if (error) throw error;

        const formattedCart = cartItems.map((item) => ({
            ...item.product,
            quantity: item.quantity,
        }));

        return new Response(JSON.stringify(formattedCart), { status: 200 });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Gagal mengambil data keranjang.";
        console.error("Error di GET /api/cart:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};

// =================================================================
// == FUNGSI POST: Menambah item baru / update kuantitas item     ==
// =================================================================
// PERBAIKAN: Tambahkan tipe APIContext ke parameter
export const POST: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        const { product_id, quantity } = await request.json();

        if (!product_id || !quantity || quantity <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Product ID dan kuantitas valid diperlukan.",
                }),
                { status: 400 },
            );
        }

        const { data: existingItem, error: selectError } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("customer_id", customerId)
            .eq("product_id", product_id)
            .maybeSingle();

        if (selectError) throw selectError;

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            const { error: updateError } = await supabase
                .from("cart_items")
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingItem.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from("cart_items")
                .insert({
                    customer_id: customerId,
                    product_id: product_id,
                    quantity: quantity,
                });
            if (insertError) throw insertError;
        }

        return new Response(
            JSON.stringify({ message: "Item berhasil diproses." }),
            { status: 200 },
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Gagal memproses item keranjang.";
        console.error("Error di POST /api/cart:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};

// =================================================================
// == FUNGSI PATCH: Mengubah kuantitas item secara spesifik       ==
// =================================================================
// PERBAIKAN: Tambahkan tipe APIContext ke parameter
export const PATCH: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        const { product_id, quantity } = await request.json();

        if (!product_id || !quantity || quantity <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Product ID dan kuantitas valid diperlukan.",
                }),
                { status: 400 },
            );
        }

        const { error } = await supabase
            .from("cart_items")
            .update({
                quantity: quantity,
                updated_at: new Date().toISOString(),
            })
            .eq("customer_id", customerId)
            .eq("product_id", product_id);

        if (error) throw error;

        return new Response(
            JSON.stringify({ message: "Kuantitas berhasil diperbarui." }),
            { status: 200 },
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Gagal memperbarui kuantitas.";
        console.error("Error di PATCH /api/cart:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};

// =================================================================
// == FUNGSI DELETE: Menghapus satu item dari keranjang           ==
// =================================================================
// PERBAIKAN: Tambahkan tipe APIContext ke parameter
export const DELETE: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        const { product_id } = await request.json();

        if (!product_id) {
            return new Response(
                JSON.stringify({ message: "Product ID diperlukan." }),
                { status: 400 },
            );
        }

        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("customer_id", customerId)
            .eq("product_id", product_id);

        if (error) throw error;

        return new Response(
            JSON.stringify({ message: "Item berhasil dihapus." }),
            { status: 200 },
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Gagal menghapus item.";
        console.error("Error di DELETE /api/cart:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};
