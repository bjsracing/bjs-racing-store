-- Migration for low-priority features: wishlist, compare, loyalty, invoice, multi-image
-- Run this in Supabase SQL Editor

-- 1. Wishlist
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_customer_product_unique UNIQUE (customer_id, product_id)
);

-- 2. Product comparisons
CREATE TABLE IF NOT EXISTS public.product_comparisons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_comparisons_pkey PRIMARY KEY (id),
  CONSTRAINT product_comparisons_customer_product_unique UNIQUE (customer_id, product_id)
);

-- 3. Loyalty points
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'earned',
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_points_pkey PRIMARY KEY (id)
);

-- 4. Product variants (group-based)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_label text;

-- 5. Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own comparisons" ON public.product_comparisons FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert own comparisons" ON public.product_comparisons FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can delete own comparisons" ON public.product_comparisons FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert own loyalty points" ON public.loyalty_points FOR INSERT WITH CHECK (auth.uid() = customer_id);
