// File: src/pages/api/cart.ts
// Perbaikan: Menambahkan logging diagnostik mendalam untuk melacak sesi dan profil.

import type { APIRoute, APIContext } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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

// --- FUNGSI DENGAN DEBUGGING ---
async function getCustomerIdFromSession(
    supabase: ReturnType<typeof createSupabaseClient>,
): Promise<string | null> {
    console.log("[DEBUG /api/cart] Memulai getCustomerIdFromSession...");

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
        console.error(
            "[DEBUG /api/cart] Error saat supabase.auth.getUser():",
            userError.message,
        );
        return null;
    }
    if (!user) {
        console.warn(
            "[DEBUG /api/cart] Tidak ada sesi pengguna yang ditemukan oleh supabase.auth.getUser().",
        );
        return null;
    }
    console.log(
        `[DEBUG /api/cart] Sesi pengguna ditemukan. User ID: ${user.id}`,
    );

    const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (customerError) {
        console.error(
            "[DEBUG /api/cart] Terjadi error saat query ke tabel customers:",
            customerError.message,
        );
        return null;
    }

    if (!customerData) {
        console.warn(
            `[DEBUG /api/cart] Query ke tabel customers berhasil, namun tidak ada profil ditemukan untuk user ID: ${user.id}`,
        );
        return null;
    }

    console.log(
        `[DEBUG /api/cart] Profil pelanggan ditemukan. Customer ID: ${customerData.id}`,
    );
    return customerData.id;
}

export const GET: APIRoute = async ({ cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        console.log("[DEBUG /api/cart] Menerima request GET...");
        const customerId = await getCustomerIdFromSession(supabase);

        if (!customerId) {
            // Ini adalah penanganan race condition. Kembalikan keranjang kosong jika profil belum siap.
            console.warn(
                "[DEBUG /api/cart] Gagal mendapatkan customerId, mengembalikan keranjang kosong.",
            );
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const { data: cartItems, error } = await supabase
            .from("cart_items")
            .select("quantity, product:products (*)")
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
        console.error("Error fatal di GET /api/cart:", errorMessage);
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
