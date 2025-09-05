// src/pages/api/addresses.ts
import type { APIRoute } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// --- GET dan DELETE tidak diubah ---
export const GET: APIRoute = async ({ cookies }) => {
  /* ... kode Anda yang sudah ada ... */
};
export const DELETE: APIRoute = async ({ request, cookies }) => {
  /* ... kode Anda yang sudah ada ... */
};
export const PUT: APIRoute = async ({ request, cookies }) => {
  /* ... kode Anda yang sudah ada ... */
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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return new Response(JSON.stringify({ message: "Otentikasi diperlukan." }), {
      status: 401,
    });

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.user.id)
    .single();
  if (customerError || !customerData)
    return new Response(
      JSON.stringify({ message: "Customer profile not found." }),
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

  // ✅ PERUBAHAN UTAMA UNTUK DEBUGGING ADA DI SINI
  if (error) {
    console.error("Supabase insert error:", error);
    // Jangan kirim pesan umum. Kirim pesan error asli dari Supabase.
    return new Response(
      JSON.stringify({ message: `Database Error: ${error.message}` }),
      { status: 500 },
    );
  }

  return new Response(JSON.stringify(newAddress), { status: 201 });
};
