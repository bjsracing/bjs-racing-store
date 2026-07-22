-- Migration: add payment_gateway_fee column to orders
alter table public.orders
  add column if not exists payment_gateway_fee numeric default 0;
