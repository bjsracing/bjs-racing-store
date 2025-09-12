// File: src/lib/supabaseBrowserClient.ts (FILE BARU)

import { createBrowserClient } from "@supabase/ssr";

// --- Tes Diagnostik: Hardcode di file yang terisolasi ---
const supabaseUrl = "https://ykotzsmncvyfveypeevb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3R6c21uY3Z5ZnZleXBlZXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjI5MzcsImV4cCI6MjA2NDc5ODkzN30.Cx9_MQt3UStH9h33NAIq7poFJF4m7wMUTzaEmcLQhbA";

// Hanya ekspor client untuk browser dari file ini.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
