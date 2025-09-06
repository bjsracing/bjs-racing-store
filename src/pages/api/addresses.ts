// File: src/pages/api/addresses.ts

import type { APIRoute, APIContext } from "astro"; // <-- TAMBAHKAN IMPORT APIContext
import MainLayout from "@/layouts/MainLayout.astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Membuat instance Supabase server client.
 */
function createSupabaseClient(cookies: APIContext["cookies"]) {
  // <-- UBAH TIPE DATA DI SINI
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          cookies.delete(key, options);
        },
      },
    },
  );
}

/**
 * Mengambil customer_id berdasarkan session user yang sedang login.
 * Melempar error jika session atau profil customer tidak ditemukan.
 */
async function getCustomerIdFromSession(
  supabase: ReturnType<typeof createSupabaseClient>,
) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError)
    throw new Error(`Authentication error: ${sessionError.message}`);
  if (!session) throw new Error("Otentikasi diperlukan.");

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (customerError)
    throw new Error(`Database query error: ${customerError.message}`);
  if (!customerData)
    throw new Error(
      "Profil pelanggan tidak ditemukan terkait dengan akun ini.",
    );

  return customerData.id;
}

// =================================================================
// == FUNGSI GET (UNTUK MENGAMBIL SEMUA ALAMAT PENGGUNA)         ==
// =================================================================
export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseClient(cookies);

  try {
    const customerId = await getCustomerIdFromSession(supabase);

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
      {
        status:
          error instanceof Error && error.message.includes("Otentikasi")
            ? 401
            : 500,
      },
    );
  }
};

// =================================================================
// == FUNGSI POST (UNTUK MENYIMPAN ALAMAT BARU)                   ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  try {
    const customerId = await getCustomerIdFromSession(supabase);
    const formData = await request.json();

    // --- PERBAIKAN VALIDASI ---
    // Memastikan semua field yang di-set NOT NULL di database divalidasi di sini.
    const { recipient_name, recipient_phone, full_address, destination } =
      formData;

    if (!recipient_name || !recipient_phone || !full_address || !destination) {
      const missingFields = [];
      if (!recipient_name) missingFields.push("Nama Penerima");
      if (!recipient_phone) missingFields.push("Nomor Telepon");
      if (!full_address) missingFields.push("Alamat Lengkap");
      if (!destination) missingFields.push("Kota/Kecamatan");

      return new Response(
        JSON.stringify({
          message: `Data wajib tidak lengkap: ${missingFields.join(", ")}`,
        }),
        { status: 400 },
      );
    }
    // --- Akhir Perbaikan Validasi ---

    const { data: newAddress, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        label: formData.label,
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        full_address: formData.full_address,
        destination: formData.destination,
        destination_text: formData.destination_text,
        postal_code: formData.postal_code,
        // is_primary ditangani terpisah jika diperlukan logika khusus
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
      {
        status:
          error instanceof Error && error.message.includes("wajib") ? 400 : 500,
      },
    );
  }
};

// =================================================================
// == FUNGSI PUT (UNTUK MENGUBAH ALAMAT)                          ==
// =================================================================
export const PUT: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  try {
    const customerId = await getCustomerIdFromSession(supabase);
    const formData = await request.json();
    const { id: addressId, ...updateData } = formData;

    if (!addressId) {
      return new Response(
        JSON.stringify({
          message: "ID Alamat diperlukan untuk proses update.",
        }),
        { status: 400 },
      );
    }

    // Validasi data yang diupdate (opsional namun disarankan)
    if (
      !updateData.recipient_name ||
      !updateData.recipient_phone ||
      !updateData.full_address ||
      !updateData.destination
    ) {
      return new Response(
        JSON.stringify({
          message: "Field wajib tidak boleh dikosongkan saat update.",
        }),
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .update(updateData)
      .eq("id", addressId)
      .eq("customer_id", customerId) // Memastikan pengguna hanya update miliknya (double check RLS)
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
    const customerId = await getCustomerIdFromSession(supabase);
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
      .eq("customer_id", customerId); // Memastikan pengguna hanya delete miliknya

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
