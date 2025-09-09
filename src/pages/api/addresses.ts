// File: src/pages/api/addresses.ts
// Perbaikan Final: Kode lengkap dengan implementasi PUT/DELETE, dan logika toleran
// untuk mengatasi race condition saat mengambil data.

import type { APIRoute, APIContext } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// --- Fungsi Helper ---

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
 * Mengambil customer_id dan objek user, dibuat tangguh terhadap race condition.
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

  // Menggunakan .maybeSingle() untuk mencegah crash jika profil belum siap dibaca.
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError)
    throw new Error(
      `Database error saat mencari profil: ${customerError.message}`,
    );
  // Jika tidak ada data customer, lempar error yang akan ditangani oleh setiap fungsi API.
  if (!customerData)
    throw new Error(
      "Profil pelanggan tidak ditemukan untuk pengguna yang login.",
    );

  return { customerId: customerData.id, user: user };
}

// =================================================================
// == FUNGSI GET: Mengambil daftar alamat                         ==
// =================================================================
export const GET: APIRoute = async ({ cookies }: APIContext) => {
  const supabase = createSupabaseClient(cookies);
  try {
    const { customerId } = await getCustomerIdAndUser(supabase);
    const { data: addresses, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_primary", { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(addresses), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Gagal mengambil data alamat.";
    // Jaring Pengaman: Jika error adalah karena profil belum ditemukan (race condition),
    // kembalikan array kosong agar UI tidak crash.
    if (errorMessage.includes("Profil pelanggan tidak ditemukan")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    console.error("Error di GET /api/addresses:", errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};

// =================================================================
// == FUNGSI POST: Menyimpan alamat baru                          ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }: APIContext) => {
  const supabase = createSupabaseClient(cookies);
  try {
    const { customerId, user } = await getCustomerIdAndUser(supabase);
    const formData = await request.json();

    const {
      recipient_name,
      recipient_phone,
      full_address,
      destination_text,
      latitude,
      longitude,
    } = formData;
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
        auth_user_id: user.id,
        label: formData.label,
        recipient_name,
        recipient_phone,
        full_address,
        destination: formData.destination,
        destination_text,
        postal_code: formData.postal_code,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(newAddress), { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi error tidak dikenal saat menyimpan alamat.";
    console.error("Error di POST /api/addresses:", errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};

// =================================================================
// == FUNGSI PUT: Mengubah alamat                                 ==
// =================================================================
export const PUT: APIRoute = async ({ request, cookies }: APIContext) => {
  const supabase = createSupabaseClient(cookies);
  try {
    const { customerId } = await getCustomerIdAndUser(supabase);
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
      .eq("customer_id", customerId)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi error tidak dikenal saat mengubah alamat.";
    console.error("Error di PUT /api/addresses:", errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};

// =================================================================
// == FUNGSI DELETE: Menghapus alamat                             ==
// =================================================================
export const DELETE: APIRoute = async ({ request, cookies }: APIContext) => {
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi error tidak dikenal saat menghapus alamat.";
    console.error("Error di DELETE /api/addresses:", errorMessage);
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
};
