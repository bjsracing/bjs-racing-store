// File: src/pages/api/addresses.ts

import type { APIRoute, APIContext } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Fungsi helper untuk inisialisasi Supabase Client
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
 * Mengambil customer_id dan objek user berdasarkan session yang sedang login.
 */
async function getCustomerIdAndUser(
  supabase: ReturnType<typeof createSupabaseClient>,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(`Authentication error: ${userError.message}`);
  if (!user) throw new Error("Otentikasi diperlukan.");

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (customerError)
    throw new Error(
      `Profil pelanggan tidak ditemukan: ${customerError.message}`,
    );
  if (!customerData) throw new Error("Data profil pelanggan tidak ditemukan.");

  // --- PERBAIKAN 1: Kembalikan objek user bersama customerId ---
  return { customerId: customerData.id, user: user };
}

// =================================================================
// == FUNGSI POST (UNTUK MENYIMPAN ALAMAT BARU)                   ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  try {
    // --- PERBAIKAN 2: Tangkap customerId dan user dari fungsi helper ---
    const { customerId, user } = await getCustomerIdAndUser(supabase);
    const formData = await request.json();

    // Validasi input wajib
    const { recipient_name, recipient_phone, full_address, destination_text } =
      formData;
    if (
      !recipient_name ||
      !recipient_phone ||
      !full_address ||
      !destination_text
    ) {
      return new Response(
        JSON.stringify({ message: "Data wajib tidak lengkap." }),
        { status: 400 },
      );
    }

    const { data: newAddress, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        auth_user_id: user.id, // <-- Sekarang variabel 'user' sudah dikenali di sini
        label: formData.label,
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        full_address: formData.full_address,
        destination: formData.destination,
        destination_text: formData.destination_text,
        postal_code: formData.postal_code,
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(newAddress), { status: 201 });
  } catch (error) {
    console.error("Error di POST /api/addresses:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal.",
      }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI PUT (UNTUK MENGUBAH ALAMAT)                          ==
// =================================================================
export const PUT: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  try {
    const { customerId } = await getCustomerIdAndUser(supabase); // Hanya butuh validasi kepemilikan
    const formData = await request.json();
    const { id: addressId, ...updateData } = formData;

    if (!addressId) {
      return new Response(
        JSON.stringify({ message: "ID Alamat diperlukan." }),
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .update(updateData)
      .eq("id", addressId)
      .eq("customer_id", customerId) // Keamanan tambahan level API
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error di PUT /api/addresses:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal.",
      }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI DELETE (UNTUK MENGHAPUS ALAMAT)                      ==
// =================================================================
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);
  try {
    const { customerId } = await getCustomerIdAndUser(supabase);
    const { addressId } = await request.json();

    if (!addressId) {
      return new Response(
        JSON.stringify({ message: "ID Alamat diperlukan." }),
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("customer_id", customerId);

    if (error) throw error;
    return new Response(
      JSON.stringify({ message: "Alamat berhasil dihapus" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error di DELETE /api/addresses:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal.",
      }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI GET (UNTUK MENGAMBIL DATA)                           ==
// =================================================================
export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseClient(cookies);
  try {
    const { customerId } = await getCustomerIdAndUser(supabase);
    const { data: addresses, error: addressesError } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (addressesError) throw addressesError;
    return new Response(JSON.stringify(addresses), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error di GET /api/addresses:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal.",
      }),
      { status: 500 },
    );
  }
};
