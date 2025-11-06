-- FIXED RLS POLICIES FOR USER AND PROFILE TABLES
-- Run this in your Supabase SQL Editor

-- =================================================================
-- FIX 1: Allow INSERT for ClientProfile and VendorProfile
-- =================================================================

-- --- ClientProfile Table ---
-- Allow clients to INSERT their own profile (during signup)
DROP POLICY IF EXISTS "Clients can create their own profile" ON public."ClientProfile";
CREATE POLICY "Clients can create their own profile"
  ON public."ClientProfile" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );

-- --- VendorProfile Table ---
-- Allow vendors to INSERT their own profile (during signup)
DROP POLICY IF EXISTS "Vendors can create their own profile" ON public."VendorProfile";
CREATE POLICY "Vendors can create their own profile"
  ON public."VendorProfile" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );


-- =================================================================
-- FIX 2: Allow INSERT for Wallet
-- =================================================================

-- --- Wallet Table ---
-- Allow users to INSERT their own wallet (during signup)
DROP POLICY IF EXISTS "Users can create their own wallet" ON public."Wallet";
CREATE POLICY "Users can create their own wallet"
  ON public."Wallet" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );


-- =================================================================
-- FIX 3: Allow INSERT for User table
-- =================================================================

-- --- User Table ---
-- Allow users to INSERT their own record (during signup via tRPC)
-- NOTE: This is a security consideration - make sure your tRPC mutation validates properly
DROP POLICY IF EXISTS "Users can create their own account" ON public."User";
CREATE POLICY "Users can create their own account"
  ON public."User" FOR INSERT
  WITH CHECK ( auth.uid()::text = id );


-- =================================================================
-- VERIFICATION QUERY
-- =================================================================
-- Run this to verify your policies are set correctly:

SELECT 
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'ClientProfile', 'VendorProfile', 'Wallet')
ORDER BY tablename, policyname;
