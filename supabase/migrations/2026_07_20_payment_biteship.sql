-- Migrasi: dukungan payment gateway BRI QRIS & kurir Biteship
-- Diterapkan ke project Supabase (jalankan di SQL editor / supabase db).

alter table public.customer_addresses
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.payments
  add column if not exists gateway text,
  add column if not exists payment_reference text;
