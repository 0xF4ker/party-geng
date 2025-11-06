# Session Fix - UNAUTHORIZED Error

## Problem
Even with RLS disabled, you were still getting `UNAUTHORIZED` errors. This means the issue was **not with RLS**, but with **session/cookie handling**.

## Root Cause
The `createTRPCContext` function in `src/server/api/trpc.ts` was trying to read Supabase cookies from HTTP **headers** instead of using Next.js **cookies API**.

### Before (Broken):
```typescript
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return opts.headers.get(name) ?? undefined; // ❌ WRONG!
        },
      },
    }
  );
  // ...
};
```

Cookies are **not** in headers - they're in a separate cookies store!

### After (Fixed):
```typescript
import { cookies } from "next/headers";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const cookieStore = await cookies(); // ✅ Get cookies properly
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value; // ✅ CORRECT!
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle errors gracefully
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle errors gracefully
          }
        },
      },
    }
  );
  // ...
};
```

## What This Fixes

1. **Supabase session is now properly read** from cookies
2. **`ctx.user` will be populated** for authenticated requests
3. **`protectedProcedure` will work** correctly
4. **`getProfile` query will succeed** after login

## Testing Steps

### 1. Clear Everything
```bash
# Clear browser data
- Open DevTools (F12)
- Application → Storage → Clear site data
- Or use Incognito mode
```

### 2. Check Console Logs
After the fix, you should see in your **server console** (not browser):

```bash
[tRPC Context] User from Supabase: abc-123-def-456
[tRPC Context] Profile from DB: abc-123-def-456
[TRPC] user.getProfile took 45ms to execute
```

And in **browser console**:

```javascript
[AuthProvider] Profile fetch status: {
  profile: {
    id: "abc-123-def-456",
    email: "test@example.com",
    username: "testuser",
    role: "CLIENT",
    clientProfile: { userId: "abc-123-def-456", ... },
    vendorProfile: null
  },
  isLoading: false,
  error: undefined // ✅ No more UNAUTHORIZED!
}
```

### 3. Test Signup Flow

1. Sign up with a new account
2. Check server logs - should show user found
3. Check browser console - should show profile loaded
4. Header should update immediately
5. Should redirect to appropriate page

### 4. Test Login Flow

1. Log in with existing account
2. Check server logs - should show user found
3. Check browser console - should show profile loaded
4. Header should update immediately
5. Should redirect to appropriate page

## Why This Happened

Next.js 15 uses App Router which handles cookies differently from Pages Router:
- **Pages Router**: Cookies available in `req.cookies`
- **App Router**: Must use `cookies()` from `next/headers`

The original code was written for Pages Router style, which is why it didn't work.

## Verify It's Working

### Test 1: Manual Cookie Check
After logging in, check Application → Cookies in DevTools:
- Should see: `sb-<project-id>-auth-token`
- Should have a value (not empty)

### Test 2: Direct Supabase Query
In browser console:

```javascript
// Check if Supabase has session
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
// Should NOT be null if logged in
```

### Test 3: Test Protected Route
Try accessing a protected tRPC route:

```typescript
const { data } = api.user.getProfile.useQuery();
console.log('Profile:', data);
// Should work without UNAUTHORIZED error
```

## Next Steps

1. **Re-enable RLS** on your tables (run your original RLS script)
2. **Add the missing INSERT policies** (run `FIXED_RLS_POLICIES.sql`)
3. **Test again** - everything should work now

## Summary of All Fixes

### File: `src/server/api/trpc.ts`
- ✅ Fixed cookie reading from headers → cookies API
- ✅ Added proper set/remove cookie handlers
- ✅ Added console logs for debugging

### File: `src/app/layout.tsx`
- ✅ Enabled `AuthProvider`

### File: `src/app/_components/LoginJoinComponent.tsx`
- ✅ Fixed view name from "signin" → "login"
- ✅ Added session check for auto-login
- ✅ Added proper redirects with timeout
- ✅ Replaced alerts with toast notifications

### File: `src/app/_components/home/Header.tsx`
- ✅ Fixed vendor/client profile detection
- ✅ Added role-based navigation
- ✅ Added loading states

### Database:
- ✅ Need to add INSERT RLS policies (see `FIXED_RLS_POLICIES.sql`)
- ✅ Disable email confirmation in Supabase (for dev)

## Expected Behavior Now

1. **Signup**: Creates account → Auto-logs in → Redirects → Header updates
2. **Login**: Authenticates → Fetches profile → Redirects → Header updates
3. **Page Reload**: Session persists → Profile auto-loads → Header shows logged-in state
4. **Logout**: Clears session → Header returns to guest state

Everything should work smoothly now! 🎉
