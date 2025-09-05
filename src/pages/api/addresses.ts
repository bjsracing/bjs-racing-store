// src/pages/api/addresses.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// =================================================================
// == FUNGSI GET (UNTUK MENGAMBIL DATA) - MODE DEBUGGING         ==
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return new Response(
        JSON.stringify({ message: "Otentikasi diperlukan." }),
        { status: 401 },
      );

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();

    if (customerError) throw customerError;
    if (!customerData)
      return new Response(
        JSON.stringify({ message: "Profil pelanggan tidak ditemukan." }),
        { status: 404 },
      );

    const customerId = customerData.id;

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
      JSON.stringify({ message: `Database Error: ${error.message}` }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI POST (UNTUK MENYIMPAN DATA BARU) - MODE DEBUGGING   ==
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return new Response(
        JSON.stringify({ message: "Otentikasi diperlukan." }),
        { status: 401 },
      );

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();
    if (customerError) throw customerError;
    if (!customerData)
      return new Response(
        JSON.stringify({ message: "Profil pelanggan tidak ditemukan." }),
        { status: 404 },
      );

    const customerId = customerData.id;
    const formData = await request.json();

    if (
      !formData.recipient_name ||
      !formData.full_address ||
      !formData.destination
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
      JSON.stringify({ message: `Database Error: ${error.message}` }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI DELETE (UNTUK MENGHAPUS ALAMAT) - MODE DEBUGGING    ==
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return new Response(
        JSON.stringify({ message: "Otentikasi diperlukan." }),
        { status: 401 },
      );

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();
    if (customerError) throw customerError;
    if (!customerData)
      return new Response(
        JSON.stringify({ message: "Profil pelanggan tidak ditemukan." }),
        { status: 404 },
      );

    const { addressId } = await request.json();
    if (!addressId)
      return new Response(
        JSON.stringify({ message: "ID Alamat diperlukan." }),
        { status: 400 },
      );

    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("customer_id", customerData.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Alamat berhasil dihapus" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error di DELETE /api/addresses:", error);
    return new Response(
      JSON.stringify({ message: `Database Error: ${error.message}` }),
      { status: 500 },
    );
  }
};

// =================================================================
// == FUNGSI PUT (UNTUK MENGUBAH ALAMAT) - MODE DEBUGGING        ==
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return new Response(
        JSON.stringify({ message: "Otentikasi diperlukan." }),
        { status: 401 },
      );

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();
    if (customerError) throw customerError;
    if (!customerData)
      return new Response(
        JSON.stringify({ message: "Profil pelanggan tidak ditemukan." }),
        { status: 404 },
      );

    const formData = await request.json();
    const { id: addressId, ...updateData } = formData;
    if (!addressId)
      return new Response(
        JSON.stringify({ message: "ID Alamat diperlukan." }),
        { status: 400 },
      );

    const { data, error } = await supabase
      .from("customer_addresses")
      .update(updateData)
      .eq("id", addressId)
      .eq("customer_id", customerData.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error di PUT /api/addresses:", error);
    return new Response(
      JSON.stringify({ message: `Database Error: ${error.message}` }),
      { status: 500 },
    );
  }
};
