// src/pages/api/addresses.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// =================================================================
// == FUNGSI GET (UNTUK MENGAMBIL DATA)                          ==
// =================================================================
export const GET: APIRoute = async ({ cookies }) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return new Response("Authentication required.", { status: 401 });

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();
  if (customerError || !customerData)
    return new Response("Customer profile not found.", { status: 404 });

  const customerId = customerData.id;

  const { data: addresses, error: addressesError } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (addressesError)
    return new Response(addressesError.message, { status: 500 });

  return new Response(JSON.stringify(addresses), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// =================================================================
// == FUNGSI POST (UNTUK MENYIMPAN DATA BARU)                    ==
// =================================================================
export const POST: APIRoute = async ({ request, cookies }) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return new Response("Authentication required.", { status: 401 });

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();
  if (customerError || !customerData)
    return new Response("Customer profile not found.", { status: 404 });

  const customerId = customerData.id;
  const formData = await request.json();

  if (
    !formData.recipient_name ||
    !formData.recipient_phone ||
    !formData.full_address
  ) {
    return new Response("Nama, telepon, dan alamat lengkap wajib diisi.", {
      status: 400,
    });
  }

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

  return new Response(JSON.stringify(newAddress), { status: 201 });
};

// =================================================================
// == FUNGSI DELETE (UNTUK MENGHAPUS ALAMAT) - KODE BARU       ==
// =================================================================
export const DELETE: APIRoute = async ({ request, cookies }) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return new Response("Authentication required", { status: 401 });

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();
  if (customerError || !customerData)
    return new Response("Customer profile not found", { status: 404 });

  const { addressId } = await request.json();
  if (!addressId)
    return new Response("Address ID is required", { status: 400 });

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerData.id); // Keamanan: Pastikan hanya pemilik yang bisa hapus

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ message: "Alamat berhasil dihapus" }), {
    status: 200,
  });
};

// =================================================================
// == FUNGSI PUT (UNTUK MENGUBAH ALAMAT) - KODE BARU           ==
// =================================================================
export const PUT: APIRoute = async ({ request, cookies }) => {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return new Response("Authentication required", { status: 401 });

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();
  if (customerError || !customerData)
    return new Response("Customer profile not found", { status: 404 });

  const formData = await request.json();
  const { id: addressId, ...updateData } = formData;
  if (!addressId)
    return new Response("Address ID is required", { status: 400 });

  const { data, error } = await supabase
    .from("customer_addresses")
    .update(updateData)
    .eq("id", addressId)
    .eq("customer_id", customerData.id) // Keamanan: Pastikan hanya pemilik yang bisa ubah
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify(data), { status: 200 });
};
