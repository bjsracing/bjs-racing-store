-- Migration for brands management
-- Brand logos for homepage marquee

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

-- 2. Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public can view active brands
CREATE POLICY "Public can view active brands" ON public.brands
  FOR SELECT USING (is_active = true);

-- Authenticated users (admin) can do full CRUD
CREATE POLICY "Admin can insert brands" ON public.brands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update brands" ON public.brands
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete brands" ON public.brands
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can view all brands" ON public.brands
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies
CREATE POLICY "Public can view brand logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-logos');

CREATE POLICY "Admin can upload brand logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete brand logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can update brand logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');
