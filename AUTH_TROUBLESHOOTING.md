# Authentication Troubleshooting Guide

## Issue: Header Not Updating After Signup/Login

### Root Causes

1. **Email Confirmation Required**
   - Supabase requires email verification by default
   - User is not automatically logged in after signup
   - Session is only created after email confirmation

2. **Auth State Not Syncing**
   - Header uses `useAuth()` hook which relies on `AuthProvider`
   - `AuthProvider` is currently commented out in root layout

## Solutions

### Option 1: Disable Email Confirmation (Development Only)

**In Supabase Dashboard:**
1. Go to your project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Disable** "Confirm email"
4. Save changes

This will allow users to be automatically logged in after signup without email verification.

### Option 2: Enable AuthProvider (Required)

**Update `src/app/layout.tsx`:**

```typescript
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <AuthProvider>  {/* UNCOMMENT THIS */}
            {children}
          </AuthProvider>  {/* UNCOMMENT THIS */}
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

The `AuthProvider` is **essential** for:
- Fetching user profile on app load
- Syncing auth state across components
- Making `useAuth()` hook work properly

### Option 3: Manual Testing

**Check if you're actually logged in:**

1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Look for Supabase auth tokens
4. Or run this in console:

```javascript
const supabase = window.supabase; // If exposed
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

## Current Implementation

The code now handles both scenarios:

### With Email Confirmation (Default)
```typescript
// User signs up
// → No session created
// → Toast: "Please check your email to verify"
// → Modal closes, stays on current page
// → User must verify email, then login manually
```

### Without Email Confirmation (Dev Mode)
```typescript
// User signs up
// → Session created automatically
// → Toast: "Account created successfully! Welcome!"
// → Modal closes
// → Redirects to dashboard/events page
// → Header updates with user info
```

## Debugging Steps

### 1. Check if AuthProvider is active

```bash
# In browser console, after attempting login:
console.log('Auth State:', useAuth());
```

### 2. Check Supabase session

Add this to your `useAuth` hook temporarily:

```typescript
useEffect(() => {
  const supabase = createClient();
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Current session:', session);
  });
}, []);
```

### 3. Check profile fetch

In `src/providers/auth-provider.tsx`, add logging:

```typescript
useEffect(() => {
  console.log('Profile from tRPC:', profile);
  if (profile) {
    setProfile(profile);
  }
}, [profile, setProfile]);
```

## Expected Flow After Fixes

### Signup (Email Confirmation Disabled)
1. User fills form → Clicks "Create my account"
2. Account created in Supabase + Database
3. Session automatically created (logged in)
4. Toast shows "Account created successfully! Welcome!"
5. Modal closes
6. Page redirects to `/v/dashboard` or `/c/manage_events`
7. **Header immediately shows logged-in state**

### Login
1. User enters credentials → Clicks "Continue"
2. Supabase authenticates user
3. Session created
4. Profile fetched via tRPC
5. Toast shows "Welcome back!"
6. Modal closes
7. Page redirects based on role
8. **Header immediately shows logged-in state**

## Quick Fix Checklist

- [ ] Enable `AuthProvider` in `src/app/layout.tsx`
- [ ] Disable email confirmation in Supabase dashboard (dev only)
- [ ] Clear browser cache and cookies
- [ ] Test signup with new account
- [ ] Check browser console for errors
- [ ] Verify session exists after signup
- [ ] Confirm header updates after signup

## Still Not Working?

Check these common issues:

1. **CORS Issues**: Make sure your Supabase URL is configured correctly
2. **Database Connection**: Ensure tRPC server is running
3. **Profile Creation**: Check if user record was created in database
4. **Auth Cookies**: Clear all cookies and try again
5. **Browser Cache**: Try incognito/private mode

## Development vs Production

### Development
- Disable email confirmation for faster testing
- Use local Supabase instance if possible
- Check logs frequently

### Production
- **Enable email confirmation** for security
- Implement proper email verification flow
- Add "Resend verification email" feature
- Show proper onboarding for unverified users
