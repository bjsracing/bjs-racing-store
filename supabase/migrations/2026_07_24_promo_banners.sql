-- Migration for promo banners management
-- Run this in Supabase SQL Editor

-- 1. Create promos table
CREATE TABLE IF NOT EXISTS public.promos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text DEFAULT 'Belanja Sekarang',
  cta_href text DEFAULT '/',
  image_url text,
  bg_gradient text DEFAULT 'from-slate-900 via-slate-800 to-slate-900',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promos_pkey PRIMARY KEY (id)
);

-- 2. Enable RLS
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public can view active promos within valid date range
CREATE POLICY "Public can view active promos" ON public.promos
  FOR SELECT USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- Authenticated users (admin) can do full CRUD
CREATE POLICY "Admin can insert promos" ON public.promos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update promos" ON public.promos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete promos" ON public.promos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Admin can view all promos (including inactive)
CREATE POLICY "Admin can view all promos" ON public.promos
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create storage bucket for promo banners
INSERT INTO storage.buckets (id, name, public) VALUES ('promo-banners', 'promo-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies
-- Public can read promo images
CREATE POLICY "Public can view promo images" ON storage.objects
  FOR SELECT USING (bucket_id = 'promo-banners');

-- Authenticated users can upload promo images
CREATE POLICY "Admin can upload promo images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'promo-banners' AND auth.role() = 'authenticated');

-- Authenticated users can delete promo images
CREATE POLICY "Admin can delete promo images" ON storage.objects
  FOR DELETE USING (bucket_id = 'promo-banners' AND auth.role() = 'authenticated');

-- Authenticated users can update promo images
CREATE POLICY "Admin can update promo images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'promo-banners' AND auth.role() = 'authenticated');
