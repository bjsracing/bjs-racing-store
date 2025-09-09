// File: src/pages/api/cart.ts
// Perbaikan: Membuat API lebih toleran terhadap race condition.

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

// Fungsi ini sekarang mengembalikan string customerId atau null jika tidak ditemukan
async function getCustomerIdFromSession(
    supabase: ReturnType<typeof createSupabaseClient>,
): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: customerData, error } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Database error saat mencari profil di /api/cart:",
            error.message,
        );
        return null;
    }

    return customerData?.id || null;
}

// --- FUNGSI GET (Mengambil Keranjang) ---
export const GET: APIRoute = async ({ cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);

        // --- PERBAIKAN UTAMA: Jaring Pengaman ---
        // Jika tidak ada customerId, kembalikan keranjang kosong daripada error.
        if (!customerId) {
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
        console.error("Error di GET /api/cart:", errorMessage);
        return new Response(JSON.stringify({ message: errorMessage }), {
            status: 500,
        });
    }
};

// --- FUNGSI POST, PATCH, DELETE (Memerlukan customerId yang valid) ---
// (Implementasi lengkap dari Turn 126, sekarang menggunakan fungsi helper yang lebih aman)

export const POST: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        if (!customerId)
            throw new Error(
                "Tidak dapat memproses keranjang karena profil pelanggan tidak ditemukan.",
            );

        const { product_id, quantity } = await request.json();
        if (!product_id || !quantity || quantity <= 0) {
            return new Response(
                JSON.stringify({
                    message: "Product ID dan kuantitas valid diperlukan.",
                }),
                { status: 400 },
            );
        }

        const { error } = await supabase.rpc("upsert_cart_item", {
            p_customer_id: customerId,
            p_product_id: product_id,
            p_quantity: quantity,
        });

        if (error) throw error;
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

export const PATCH: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        if (!customerId)
            throw new Error(
                "Tidak dapat mengubah keranjang karena profil pelanggan tidak ditemukan.",
            );

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

export const DELETE: APIRoute = async ({ request, cookies }: APIContext) => {
    const supabase = createSupabaseClient(cookies);
    try {
        const customerId = await getCustomerIdFromSession(supabase);
        if (!customerId)
            throw new Error(
                "Tidak dapat menghapus item karena profil pelanggan tidak ditemukan.",
            );

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
