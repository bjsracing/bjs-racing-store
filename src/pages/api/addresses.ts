// src/pages/api/addresses.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// =================================================================
// == FUNGSI GET (UNTUK MENGAMBIL DATA) - VERSI BARU & BENAR     ==
// =================================================================
export const GET: APIRoute = async ({ cookies }) => {
  // 1. Buat Supabase client versi server
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
      },
    },
  );

  // 2. Dapatkan sesi pengguna dari cookie secara aman
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Authentication required.", { status: 401 });
  }

  // 3. Ambil customer_id yang terhubung dengan user_id
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (customerError || !customerData) {
    return new Response("Customer profile not found.", { status: 404 });
  }

  const customerId = customerData.id;

  // 4. Ambil semua alamat milik customer tersebut
  const { data: addresses, error: addressesError } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (addressesError) {
    return new Response(addressesError.message, { status: 500 });
  }

  // 5. Kembalikan data sebagai JSON
  return new Response(JSON.stringify(addresses), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// =================================================================
// == FUNGSI POST (UNTUK MENYIMPAN DATA) - VERSI BARU & BENAR   ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Buat Supabase client versi server
  const supabase = createServerClient(
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

  // 2. Dapatkan sesi pengguna secara aman
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Authentication required.", { status: 401 });
  }

  // 3. Ambil customer_id
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (customerError || !customerData) {
    return new Response("Customer profile not found.", { status: 404 });
  }
  const customerId = customerData.id;

  // 4. Ambil data formulir dari body request
  const formData = await request.json();

  // 5. Validasi
  if (
    !formData.recipient_name ||
    !formData.recipient_phone ||
    !formData.full_address
  ) {
    return new Response("Nama, telepon, dan alamat lengkap wajib diisi.", {
      status: 400,
    });
  }

  // 6. Masukkan data baru ke database
  const { data: newAddress, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      label: formData.label,
      recipient_name: formData.recipient_name,
      recipient_phone: formData.recipient_phone,
      full_address: formData.full_address,
      province_id: formData.province_id,
      city_id: formData.city_id,
      postal_code: formData.postal_code,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return new Response("Gagal menyimpan alamat ke database.", { status: 500 });
  }

  // 7. Kembalikan data alamat yang baru dibuat
  return new Response(JSON.stringify(newAddress), { status: 201 });
};
