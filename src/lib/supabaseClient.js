// src/lib/supabaseClient.js

import { createBrowserClient } from "@supabase/ssr/";

// Client ini khusus untuk digunakan di sisi browser (komponen React)
export const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
