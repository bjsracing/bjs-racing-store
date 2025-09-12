// File: src/env.d.ts

/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import("@supabase/supabase-js").Session | null;
    supabase: import("@supabase/supabase-js").SupabaseClient;
  }
}
