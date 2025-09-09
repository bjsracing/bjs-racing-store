// File: src/pages/api/cart.ts
// Deskripsi: API Backend untuk mengelola keranjang belanja pengguna yang disimpan di database.

import type { APIRoute, APIContext } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// --- Fungsi Helper (DRY - Don't Repeat Yourself) ---

/**
 * Membuat instance Supabase server client.
 */
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

/**
 * Mengambil customer_id dari pengguna yang sedang login.
 * Melempar error jika tidak ada sesi atau profil customer tidak ditemukan.
 */
async function getCustomerId(
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
        .single();

    if (error || !customerData)
        throw new Error("Profil pelanggan tidak ditemukan.");

    return customerData.id;
}

// =================================================================
// == FUNGSI GET: Mengambil isi keranjang belanja pengguna        ==
// =================================================================
export const GET: APIRoute = async ({ cookies }) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerId(supabase);

        // Ambil item keranjang dan gabungkan dengan detail produknya
        const { data: cartItems, error } = await supabase
            .from("cart_items")
            .select(
                `
        quantity,
        product:products (
          id,
          nama,
          harga_jual,
          image_url,
          berat_gram,
          merek,
          ukuran
        )
      `,
            )
            .eq("customer_id", customerId);

        if (error) throw error;

        // Ubah struktur data agar cocok dengan state di frontend
        const formattedCart = cartItems.map((item) => ({
            ...item.product,
            quantity: item.quantity,
        }));

        return new Response(JSON.stringify(formattedCart), { status: 200 });
    } catch (error) {
        return new Response(
            JSON.stringify({
                message:
                    error instanceof Error
                        ? error.message
                        : "Gagal mengambil data keranjang.",
            }),
            { status: 500 },
        );
    }
};

// =================================================================
// == FUNGSI POST: Menambah item baru / update kuantitas item     ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerId(supabase);
        const { product_id, quantity } = await request.json();

        if (!product_id || !quantity || quantity <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Product ID dan kuantitas yang valid diperlukan.",
                }),
                { status: 400 },
            );
        }

        // Gunakan upsert untuk menambah item baru atau menambah kuantitas jika sudah ada.
        // Catatan: Ini memerlukan sedikit trik karena upsert Supabase tidak bisa "increment" secara native.
        // Kita akan melakukan ini dalam sebuah RPC function untuk atomicity.

        // Pertama, buat fungsi RPC di Supabase SQL Editor:
        /* CREATE OR REPLACE FUNCTION upsert_cart_item(
            p_customer_id UUID,
            p_product_id UUID,
            p_quantity INT
        )
        RETURNS VOID AS $$
        BEGIN
            INSERT INTO public.cart_items (customer_id, product_id, quantity)
            VALUES (p_customer_id, p_product_id, p_quantity)
            ON CONFLICT (customer_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + p_quantity;
        END;
        $$ LANGUAGE plpgsql;
        */

        const { error } = await supabase.rpc("upsert_cart_item", {
            p_customer_id: customerId,
            p_product_id: product_id,
            p_quantity: quantity,
        });

        if (error) throw error;

        return new Response(
            JSON.stringify({
                message: "Item berhasil ditambahkan ke keranjang.",
            }),
            { status: 200 },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                message:
                    error instanceof Error
                        ? error.message
                        : "Gagal memproses item keranjang.",
            }),
            { status: 500 },
        );
    }
};

// =================================================================
// == FUNGSI PATCH: Mengubah kuantitas item secara spesifik       ==
// =================================================================
export const PATCH: APIRoute = async ({ request, cookies }) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerId(supabase);
        const { product_id, quantity } = await request.json();

        if (!product_id || !quantity || quantity <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Product ID dan kuantitas yang valid diperlukan.",
                }),
                { status: 400 },
            );
        }

        const { error } = await supabase
            .from("cart_items")
            .update({ quantity: quantity })
            .eq("customer_id", customerId)
            .eq("product_id", product_id);

        if (error) throw error;

        return new Response(
            JSON.stringify({ message: "Kuantitas berhasil diperbarui." }),
            { status: 200 },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                message:
                    error instanceof Error
                        ? error.message
                        : "Gagal memperbarui kuantitas.",
            }),
            { status: 500 },
        );
    }
};

// =================================================================
// == FUNGSI DELETE: Menghapus satu item dari keranjang           ==
// =================================================================
export const DELETE: APIRoute = async ({ request, cookies }) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerId(supabase);
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
            JSON.stringify({
                message: "Item berhasil dihapus dari keranjang.",
            }),
            { status: 200 },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                message:
                    error instanceof Error
                        ? error.message
                        : "Gagal menghapus item.",
            }),
            { status: 500 },
        );
    }
};
