// src/pages/api/addresses.ts
import type { APIRoute } from 'astro';
// ✨ Kode menjadi lebih bersih dengan path alias
import { supabase } from '@/lib/supabaseClient.js';

export const GET: APIRoute = async ({ request, cookies }) => {
  // 1. Ambil token dari cookies
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response("Authentication required.", { status: 401 });
  }

  // 2. Otentikasi pengguna di server
  const {
    data: { user },
  } = await supabase.auth.setSession({
    refresh_token: refreshToken.value,
    access_token: accessToken.value,
  });

  if (!user) {
    return new Response("Authentication failed.", { status: 401 });
  }

  // 3. Ambil customer_id yang terhubung dengan auth_user_id
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
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
