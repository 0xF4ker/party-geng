# Fix: UNAUTHORIZED Error After Signup

## Problem
After signup, you're getting `TRPCClientError: UNAUTHORIZED` when the app tries to fetch your profile.

## Root Cause
Your RLS (Row Level Security) policies are blocking the user creation and profile queries. Specifically:

1. **Missing INSERT policies** on `User`, `ClientProfile`, `VendorProfile`, and `Wallet` tables
2. The `createUser` tRPC mutation can't insert records due to RLS
3. The `getProfile` query can't read the profiles

## Solution Steps

### Step 1: Add Missing RLS Policies

**Run this SQL in your Supabase SQL Editor:**

```sql
-- =================================================================
-- FIX 1: Allow INSERT for ClientProfile and VendorProfile
-- =================================================================

-- ClientProfile Table
DROP POLICY IF EXISTS "Clients can create their own profile" ON public."ClientProfile";
CREATE POLICY "Clients can create their own profile"
  ON public."ClientProfile" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );

-- VendorProfile Table  
DROP POLICY IF EXISTS "Vendors can create their own profile" ON public."VendorProfile";
CREATE POLICY "Vendors can create their own profile"
  ON public."VendorProfile" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );

-- =================================================================
-- FIX 2: Allow INSERT for Wallet
-- =================================================================

DROP POLICY IF EXISTS "Users can create their own wallet" ON public."Wallet";
CREATE POLICY "Users can create their own wallet"
  ON public."Wallet" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" );

-- =================================================================
-- FIX 3: Allow INSERT for User table
-- =================================================================

DROP POLICY IF EXISTS "Users can create their own account" ON public."User";
CREATE POLICY "Users can create their own account"
  ON public."User" FOR INSERT
  WITH CHECK ( auth.uid()::text = id );
```

Or simply run the file: `FIXED_RLS_POLICIES.sql`

### Step 2: Disable Email Confirmation (Development)

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Auth**
3. **Uncheck** "Confirm email"
4. Click **Save**

This ensures users are automatically logged in after signup.

### Step 3: Clear Existing Data (if any)

If you have test accounts that failed to create properly:

```sql
-- Delete test users (CAUTION: Only for development!)
DELETE FROM auth.users WHERE email LIKE '%test%';
DELETE FROM public."User" WHERE email LIKE '%test%';
```

### Step 4: Test Signup Flow

1. **Clear browser data** (cookies, local storage)
2. **Sign up with a new email**
3. **Check browser console** for:
   - `[AuthProvider] Profile fetch status:` logs
   - Should show `profile: {...}` with your user data
   - Should NOT show `error: UNAUTHORIZED`

## Expected Console Output (Success)

```javascript
[AuthProvider] Profile fetch status: {
  profile: {
    id: "...",
    email: "...",
    username: "...",
    role: "CLIENT" or "VENDOR",
    vendorProfile: { ... } or null,
    clientProfile: { ... } or null
  },
  isLoading: false,
  error: undefined
}
```

## If Still Getting UNAUTHORIZED

### Check 1: Verify RLS Policies

Run this query to see all your policies:

```sql
SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE '' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE '' 
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'ClientProfile', 'VendorProfile', 'Wallet')
ORDER BY tablename, policyname;
```

You should see policies for:
- `User`: SELECT, UPDATE, INSERT
- `ClientProfile`: SELECT, UPDATE, INSERT  
- `VendorProfile`: SELECT, UPDATE, INSERT
- `Wallet`: SELECT, INSERT

### Check 2: Verify Session

Open browser console and run:

```javascript
// Check if session exists
const response = await fetch('/api/trpc/auth.getSession');
const data = await response.json();
console.log('Session:', data);
```

### Check 3: Test Direct Database Query

In Supabase SQL Editor with **RLS enabled**:

```sql
-- This should return your user (replace with your auth.uid())
SELECT * FROM public."User" 
WHERE id = auth.uid()::text;

-- This should return your profile
SELECT * FROM public."ClientProfile" 
WHERE "userId" = auth.uid()::text;
-- OR
SELECT * FROM public."VendorProfile" 
WHERE "userId" = auth.uid()::text;
```

If these queries fail, your RLS policies are incorrect.

## Alternative: Bypass RLS for Development

**⚠️ ONLY FOR LOCAL DEVELOPMENT - NEVER IN PRODUCTION**

You can temporarily disable RLS to test:

```sql
-- Disable RLS (DANGEROUS!)
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClientProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."VendorProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Wallet" DISABLE ROW LEVEL SECURITY;
```

If this works, it confirms the issue is with your RLS policies.

**Remember to re-enable RLS when done testing!**

## Production Considerations

For production, you should:

1. **Use Supabase Edge Functions** or **Database Triggers** for user creation instead of client-side tRPC
2. **Implement proper role checks** in your policies
3. **Add rate limiting** to prevent abuse
4. **Enable email verification** and handle unverified users properly
5. **Add audit logging** for sensitive operations

## Quick Checklist

- [ ] Run the SQL fixes in `FIXED_RLS_POLICIES.sql`
- [ ] Disable email confirmation in Supabase dashboard
- [ ] Clear browser data
- [ ] Test signup with new email
- [ ] Check console logs - should show profile data
- [ ] Verify header updates with user info
- [ ] Verify redirect works to dashboard/events

## Need More Help?

Check the console logs carefully:
1. Look for any SQL errors in Supabase logs
2. Check Network tab for failed API calls
3. Verify your Supabase credentials in .env
4. Make sure your database connection is working
