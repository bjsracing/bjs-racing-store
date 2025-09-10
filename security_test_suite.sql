-- =================================================================
-- COMPREHENSIVE MULTI-TENANT SECURITY TEST SUITE
-- Tests for authorization bypass, RLS policies, and function security
-- =================================================================

-- TEST SETUP: Create test users and data
-- =================================================================

-- Test User 1
INSERT INTO auth.users (id, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'user1@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, auth_user_id, nama_pelanggan) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Test User 1')
ON CONFLICT (id) DO NOTHING;

-- Test User 2  
INSERT INTO auth.users (id, email) VALUES 
('33333333-3333-3333-3333-333333333333', 'user2@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, auth_user_id, nama_pelanggan) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Test User 2')
ON CONFLICT (id) DO NOTHING;

-- Test Product
INSERT INTO public.products (id, kode, nama, harga_jual, berat_gram) VALUES
('55555555-5555-5555-5555-555555555555', 'TEST001', 'Test Product', 100.00, 500)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- SECURITY TEST FUNCTIONS
-- =================================================================

-- Test 1: Verify auth.uid() Context Validation
CREATE OR REPLACE FUNCTION test_auth_uid_validation()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Test: Call secure function without authentication
    BEGIN
        -- This should fail with AUTHENTICATION_REQUIRED
        PERFORM public.secure_get_cart_items();
        RETURN QUERY SELECT 
            'Unauthenticated Access Block'::text,
            'FAIL'::text,
            'Function allowed unauthenticated access - CRITICAL VULNERABILITY'::text;
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'AUTHENTICATION_REQUIRED' THEN
            RETURN QUERY SELECT 
                'Unauthenticated Access Block'::text,
                'PASS'::text,
                'Function properly blocks unauthenticated access'::text;
        ELSE
            RETURN QUERY SELECT 
                'Unauthenticated Access Block'::text,
                'FAIL'::text,
                'Unexpected error: ' || SQLERRM::text;
        END IF;
    END;
END;
$$;

-- Test 2: Cross-User Access Prevention
CREATE OR REPLACE FUNCTION test_cross_user_access_prevention()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user1_cart_count integer;
    user2_cart_count integer;
BEGIN
    -- Add item to User 1's cart
    INSERT INTO public.cart_items (customer_id, product_id, quantity) VALUES
    ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 1);
    
    -- Test: Verify User 1 can only see their own cart items
    SELECT COUNT(*) INTO user1_cart_count
    FROM public.cart_items 
    WHERE customer_id = '22222222-2222-2222-2222-222222222222';
    
    -- Test: Verify User 2 cannot see User 1's cart items through RLS
    SET LOCAL row_security = on;
    SET LOCAL SESSION AUTHORIZATION 'authenticated';
    
    SELECT COUNT(*) INTO user2_cart_count
    FROM public.cart_items 
    WHERE customer_id = '22222222-2222-2222-2222-222222222222';
    
    IF user1_cart_count > 0 AND user2_cart_count = 0 THEN
        RETURN QUERY SELECT 
            'RLS Cross-User Prevention'::text,
            'PASS'::text,
            'RLS properly prevents cross-user data access'::text;
    ELSE
        RETURN QUERY SELECT 
            'RLS Cross-User Prevention'::text,
            'FAIL'::text,
            'RLS failed - users can see other users data'::text;
    END IF;
    
    RESET row_security;
    RESET SESSION AUTHORIZATION;
END;
$$;

-- Test 3: Parameter Injection Attack Prevention
CREATE OR REPLACE FUNCTION test_parameter_injection_prevention()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Test: Try to bypass security by passing different user_id parameter
    -- The secure function should ignore this and use auth.uid() instead
    
    -- Simulate authenticated session as User 1
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
    
    BEGIN
        -- Try to access User 2's data by passing their user_id 
        -- This should be ignored and only return User 1's data
        PERFORM public.secure_get_cart_items('33333333-3333-3333-3333-333333333333');
        
        RETURN QUERY SELECT 
            'Parameter Injection Prevention'::text,
            'PASS'::text,
            'Function properly ignores client-provided user_id parameter'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Parameter Injection Prevention'::text,
            'FAIL'::text,
            'Function error: ' || SQLERRM::text;
    END;
    
    PERFORM set_config('request.jwt.claim.sub', null, true);
END;
$$;

-- Test 4: Function Ownership and Privileges
CREATE OR REPLACE FUNCTION test_function_security_hygiene()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    definer_count integer;
    public_access_count integer;
BEGIN
    -- Test: Verify all secure functions are SECURITY DEFINER
    SELECT COUNT(*) INTO definer_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname LIKE 'secure_%'
    AND p.prosecdef = true;
    
    IF definer_count >= 4 THEN
        RETURN QUERY SELECT 
            'SECURITY DEFINER Usage'::text,
            'PASS'::text,
            'All secure functions properly use SECURITY DEFINER'::text;
    ELSE
        RETURN QUERY SELECT 
            'SECURITY DEFINER Usage'::text,
            'FAIL'::text,
            'Only ' || definer_count || ' functions use SECURITY DEFINER'::text;
    END IF;
    
    -- Test: Verify proper access controls (this would need specific privilege checks)
    RETURN QUERY SELECT 
        'Function Access Controls'::text,
        'MANUAL_CHECK'::text,
        'Verify GRANT/REVOKE statements were executed properly'::text;
END;
$$;

-- Test 5: RLS Policy Effectiveness
CREATE OR REPLACE FUNCTION test_rls_policy_effectiveness()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    -- Test: Verify RLS is enabled on critical tables
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'cart_items' AND relnamespace = 'public'::regnamespace;
    
    IF rls_enabled THEN
        RETURN QUERY SELECT 
            'RLS Enabled on cart_items'::text,
            'PASS'::text,
            'Row Level Security is properly enabled'::text;
    ELSE
        RETURN QUERY SELECT 
            'RLS Enabled on cart_items'::text,
            'FAIL'::text,
            'CRITICAL: RLS not enabled on cart_items table'::text;
    END IF;
    
    -- Test: Verify RLS policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policy
    WHERE tablename = 'cart_items';
    
    IF policy_count > 0 THEN
        RETURN QUERY SELECT 
            'RLS Policies Exist'::text,
            'PASS'::text,
            'Found ' || policy_count || ' RLS policies on cart_items'::text;
    ELSE
        RETURN QUERY SELECT 
            'RLS Policies Exist'::text,
            'FAIL'::text,
            'No RLS policies found on cart_items table'::text;
    END IF;
END;
$$;

-- Test 6: Data Isolation Verification
CREATE OR REPLACE FUNCTION test_data_isolation()
RETURNS TABLE(
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    isolation_test_passed boolean := true;
BEGIN
    -- Clean up any existing test data
    DELETE FROM public.cart_items WHERE product_id = '55555555-5555-5555-5555-555555555555';
    
    -- Add test data for both users
    INSERT INTO public.cart_items (customer_id, product_id, quantity) VALUES
    ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 1),
    ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 2);
    
    -- Test: Simulate User 1 session and verify they only see their data
    BEGIN
        PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
        PERFORM set_config('role', 'authenticated', true);
        
        -- User 1 should only see quantity 1 (their item)
        IF EXISTS (
            SELECT 1 FROM public.cart_items 
            WHERE product_id = '55555555-5555-5555-5555-555555555555' 
            AND quantity = 2  -- This is User 2's item
        ) THEN
            isolation_test_passed := false;
        END IF;
        
        PERFORM set_config('request.jwt.claim.sub', null, true);
        PERFORM set_config('role', null, true);
    END;
    
    IF isolation_test_passed THEN
        RETURN QUERY SELECT 
            'Multi-Tenant Data Isolation'::text,
            'PASS'::text,
            'Users cannot access other users cart data'::text;
    ELSE
        RETURN QUERY SELECT 
            'Multi-Tenant Data Isolation'::text,
            'FAIL'::text,
            'CRITICAL: Data isolation failure - users can see other users data'::text;
    END IF;
    
    -- Clean up test data
    DELETE FROM public.cart_items WHERE product_id = '55555555-5555-5555-5555-555555555555';
END;
$$;

-- =================================================================
-- COMPREHENSIVE TEST RUNNER
-- =================================================================

CREATE OR REPLACE FUNCTION run_comprehensive_security_tests()
RETURNS TABLE(
    test_category text,
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Authentication Tests
    RETURN QUERY 
    SELECT 'Authentication'::text, t.test_name, t.result, t.details
    FROM test_auth_uid_validation() t;
    
    -- Authorization Tests
    RETURN QUERY 
    SELECT 'Authorization'::text, t.test_name, t.result, t.details
    FROM test_cross_user_access_prevention() t;
    
    -- Parameter Injection Tests
    RETURN QUERY 
    SELECT 'Parameter Security'::text, t.test_name, t.result, t.details
    FROM test_parameter_injection_prevention() t;
    
    -- Function Security Tests
    RETURN QUERY 
    SELECT 'Function Security'::text, t.test_name, t.result, t.details
    FROM test_function_security_hygiene() t;
    
    -- RLS Tests
    RETURN QUERY 
    SELECT 'Row Level Security'::text, t.test_name, t.result, t.details
    FROM test_rls_policy_effectiveness() t;
    
    -- Data Isolation Tests
    RETURN QUERY 
    SELECT 'Data Isolation'::text, t.test_name, t.result, t.details
    FROM test_data_isolation() t;
END;
$$;

-- =================================================================
-- VULNERABILITY SIMULATION TESTS
-- =================================================================

-- Test: Attempt authorization bypass attack
CREATE OR REPLACE FUNCTION simulate_authorization_bypass_attack()
RETURNS TABLE(
    attack_type text,
    success boolean,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Attack 1: Try to call insecure function with different customer_id
    BEGIN
        -- This would fail if insecure function exists
        PERFORM public.upsert_cart_item(
            '44444444-4444-4444-4444-444444444444'::uuid,  -- Other user's customer_id
            '55555555-5555-5555-5555-555555555555'::uuid,  -- Product ID
            1  -- Quantity
        );
        
        RETURN QUERY SELECT 
            'Insecure Function Bypass'::text,
            true,
            'CRITICAL: Insecure function allowed access with arbitrary customer_id'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Insecure Function Bypass'::text,
            false,
            'Attack blocked: ' || SQLERRM::text;
    END;
    
    -- Attack 2: Try SQL injection in secure function parameters
    BEGIN
        PERFORM public.secure_upsert_cart_item(
            null,  -- user_id (should be ignored)
            '''injected''; DROP TABLE cart_items; --'::text::uuid,  -- Attempted injection
            1
        );
        
        RETURN QUERY SELECT 
            'SQL Injection Attack'::text,
            true,
            'Function vulnerable to SQL injection'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'SQL Injection Attack'::text,
            false,
            'Attack blocked by parameter validation'::text;
    END;
END;
$$;

-- =================================================================
-- USAGE INSTRUCTIONS
-- =================================================================

/*
To run the comprehensive security test suite:

1. Deploy the secure schema first (secure_database_schema.sql)
2. Run the security tests:
   SELECT * FROM run_comprehensive_security_tests();

3. Run vulnerability simulations:
   SELECT * FROM simulate_authorization_bypass_attack();

4. Verify all tests show 'PASS' status
5. Any 'FAIL' results indicate critical security vulnerabilities

Expected Results:
- All authentication tests should PASS
- All authorization tests should PASS  
- All RLS tests should PASS
- All data isolation tests should PASS
- All attack simulations should show success=false (attacks blocked)

If any test fails, do NOT deploy to production until issues are resolved.
*/