-- =================================================================
-- SECURE CART SYSTEM DATABASE IMPLEMENTATION
-- Production-grade security with auth.uid() validation and RLS
-- =================================================================

-- 1. CREATE CART_ITEMS TABLE WITH PROPER SECURITY
-- =================================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Primary key
    CONSTRAINT cart_items_pkey PRIMARY KEY (id),
    
    -- Foreign keys with proper constraints
    CONSTRAINT cart_items_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT cart_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Prevent duplicate items for same customer/product
    CONSTRAINT cart_items_customer_product_unique 
        UNIQUE (customer_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS cart_items_customer_id_idx ON public.cart_items(customer_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON public.cart_items(product_id);

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER cart_items_update_trigger
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =================================================================

-- Enable RLS on cart_items table
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customer_addresses table (if not already enabled)  
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RESTRICTIVE RLS POLICIES
-- =================================================================

-- RLS Policy for cart_items: Users can only access their own cart items
CREATE POLICY "Users can only access their own cart items" ON public.cart_items
    FOR ALL USING (
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
    );

-- RLS Policy for customers: Users can only access their own customer record
CREATE POLICY "Users can only access their own customer data" ON public.customers
    FOR ALL USING (auth_user_id = auth.uid());

-- RLS Policy for customer_addresses: Users can only access their own addresses
CREATE POLICY "Users can only access their own addresses" ON public.customer_addresses
    FOR ALL USING (
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
    );

-- 4. SECURE RPC FUNCTIONS WITH AUTH.UID() VALIDATION
-- =================================================================

-- Function 1: Secure Get Cart Items
-- Derives user context from auth.uid() internally, ignoring client parameters
CREATE OR REPLACE FUNCTION public.secure_get_cart_items(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
    id uuid,
    nama text,
    harga_jual numeric,
    image_url text,
    berat_gram integer,
    merek text,
    ukuran text,
    quantity integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authenticated_user_id uuid;
    customer_record_id uuid;
BEGIN
    -- ✅ SECURITY: Derive user context from auth.uid() - NEVER trust client parameters
    authenticated_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
    END IF;
    
    -- Get customer record for authenticated user
    SELECT c.id INTO customer_record_id
    FROM public.customers c
    WHERE c.auth_user_id = authenticated_user_id;
    
    -- Verify customer profile exists
    IF customer_record_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_MISSING';
    END IF;
    
    -- ✅ SECURITY: Return only data owned by authenticated user
    RETURN QUERY
    SELECT 
        p.id,
        p.nama,
        p.harga_jual,
        p.image_url,
        p.berat_gram,
        p.merek,
        p.ukuran,
        ci.quantity
    FROM public.cart_items ci
    JOIN public.products p ON ci.product_id = p.id
    WHERE ci.customer_id = customer_record_id;
END;
$$;

-- Function 2: Secure Upsert Cart Item  
-- Validates ownership internally using auth.uid()
CREATE OR REPLACE FUNCTION public.secure_upsert_cart_item(
    p_user_id uuid DEFAULT NULL,  -- Ignored for security
    p_product_id uuid,
    p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authenticated_user_id uuid;
    customer_record_id uuid;
BEGIN
    -- ✅ SECURITY: Derive user context from auth.uid() - NEVER trust client parameters
    authenticated_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
    END IF;
    
    -- Validate parameters
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'INVALID_PARAMETERS';
    END IF;
    
    -- Get customer record for authenticated user
    SELECT c.id INTO customer_record_id
    FROM public.customers c
    WHERE c.auth_user_id = authenticated_user_id;
    
    -- Verify customer profile exists
    IF customer_record_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_MISSING';
    END IF;
    
    -- Verify product exists
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;
    
    -- ✅ SECURITY: Upsert only for authenticated user's customer record
    INSERT INTO public.cart_items (customer_id, product_id, quantity)
    VALUES (customer_record_id, p_product_id, p_quantity)
    ON CONFLICT (customer_id, product_id)
    DO UPDATE SET 
        quantity = cart_items.quantity + EXCLUDED.quantity,
        updated_at = now();
END;
$$;

-- Function 3: Secure Update Cart Item Quantity
-- Validates ownership and updates only user's own items
CREATE OR REPLACE FUNCTION public.secure_update_cart_item_quantity(
    p_user_id uuid DEFAULT NULL,  -- Ignored for security
    p_product_id uuid,
    p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authenticated_user_id uuid;
    customer_record_id uuid;
    rows_affected integer;
BEGIN
    -- ✅ SECURITY: Derive user context from auth.uid()
    authenticated_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
    END IF;
    
    -- Validate parameters
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity < 0 THEN
        RAISE EXCEPTION 'INVALID_PARAMETERS';
    END IF;
    
    -- Get customer record for authenticated user
    SELECT c.id INTO customer_record_id
    FROM public.customers c
    WHERE c.auth_user_id = authenticated_user_id;
    
    -- Verify customer profile exists
    IF customer_record_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_MISSING';
    END IF;
    
    -- ✅ SECURITY: Delete item if quantity is 0, otherwise update
    IF p_quantity = 0 THEN
        DELETE FROM public.cart_items
        WHERE customer_id = customer_record_id AND product_id = p_product_id;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
    ELSE
        UPDATE public.cart_items
        SET quantity = p_quantity, updated_at = now()
        WHERE customer_id = customer_record_id AND product_id = p_product_id;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
    END IF;
    
    -- Verify operation affected a row (item existed and belonged to user)
    IF rows_affected = 0 THEN
        RAISE EXCEPTION 'CART_ITEM_NOT_FOUND_OR_ACCESS_DENIED';
    END IF;
END;
$$;

-- Function 4: Secure Clear Cart
-- Clears only authenticated user's cart items
CREATE OR REPLACE FUNCTION public.secure_clear_cart(p_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    authenticated_user_id uuid;
    customer_record_id uuid;
BEGIN
    -- ✅ SECURITY: Derive user context from auth.uid()
    authenticated_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
    END IF;
    
    -- Get customer record for authenticated user
    SELECT c.id INTO customer_record_id
    FROM public.customers c
    WHERE c.auth_user_id = authenticated_user_id;
    
    -- Verify customer profile exists
    IF customer_record_id IS NULL THEN
        RAISE EXCEPTION 'CUSTOMER_PROFILE_MISSING';
    END IF;
    
    -- ✅ SECURITY: Delete only authenticated user's cart items
    DELETE FROM public.cart_items
    WHERE customer_id = customer_record_id;
END;
$$;

-- 5. SECURITY DEFINER FUNCTION HYGIENE
-- =================================================================

-- Set proper ownership and grants for all secure functions
-- (These commands should be run by a database administrator)

-- Revoke public access to sensitive functions
REVOKE ALL ON FUNCTION public.secure_get_cart_items(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.secure_upsert_cart_item(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.secure_update_cart_item_quantity(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.secure_clear_cart(uuid) FROM PUBLIC;

-- Grant execute permissions only to authenticated users
GRANT EXECUTE ON FUNCTION public.secure_get_cart_items(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_upsert_cart_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_update_cart_item_quantity(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_clear_cart(uuid) TO authenticated;

-- 6. REMOVE OR SECURE EXISTING INSECURE FUNCTIONS
-- =================================================================

-- Option A: Remove insecure functions entirely (RECOMMENDED)
-- DROP FUNCTION IF EXISTS public.upsert_cart_item(uuid, uuid, integer);

-- Option B: Make existing functions secure (alternative approach)
-- This would require rewriting them to use auth.uid() validation

-- 7. CREATE AUDIT FUNCTION FOR SECURITY TESTING
-- =================================================================

CREATE OR REPLACE FUNCTION public.audit_cart_security()
RETURNS TABLE(
    test_name text,
    status text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Test 1: Verify RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled on cart_items'::text,
        CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END::text,
        CASE WHEN relrowsecurity 
             THEN 'Row Level Security is properly enabled'
             ELSE 'CRITICAL: RLS not enabled - security vulnerability'
        END::text
    FROM pg_class
    WHERE relname = 'cart_items' AND relnamespace = 'public'::regnamespace;
    
    -- Test 2: Verify secure functions exist
    RETURN QUERY
    SELECT 
        'Secure Functions Exist'::text,
        CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || COUNT(*) || ' of 4 required secure functions'::text
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('secure_get_cart_items', 'secure_upsert_cart_item', 
                      'secure_update_cart_item_quantity', 'secure_clear_cart');
    
    -- Test 3: Verify functions are SECURITY DEFINER
    RETURN QUERY
    SELECT 
        'Functions are SECURITY DEFINER'::text,
        CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || COUNT(*) || ' SECURITY DEFINER functions'::text
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname LIKE 'secure_%'
    AND p.prosecdef = true;
END;
$$;

-- =================================================================
-- DEPLOYMENT NOTES
-- =================================================================

-- 1. Run this script as a database administrator
-- 2. Test all functions with multi-tenant scenarios
-- 3. Verify RLS policies block cross-user access
-- 4. Run audit_cart_security() function to verify implementation
-- 5. Update application error handling for new exception types
-- 6. Consider removing old insecure functions after verification

-- =================================================================
-- SECURITY VALIDATION CHECKLIST
-- =================================================================

-- ✅ All functions derive user context from auth.uid()
-- ✅ No client parameters trusted for user identity
-- ✅ RLS policies enabled on all sensitive tables
-- ✅ Functions use SECURITY DEFINER with proper search_path
-- ✅ Proper error handling for security violations
-- ✅ Input validation on all parameters
-- ✅ Foreign key constraints enforced
-- ✅ Audit functions for security testing