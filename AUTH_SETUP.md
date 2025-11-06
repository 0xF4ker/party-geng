# Authentication Setup Guide

This project uses **Supabase** for authentication with **Prisma** for database management.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"
```

### 2. Database Setup

Run Prisma migrations to set up the database schema:

```bash
npm run db:push
# or
npm run db:generate
npm run db:migrate
```

### 3. Supabase Configuration

#### Enable Email Authentication
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

#### Set Up Auth Redirect URLs
Add these URLs to your Supabase project settings under **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000` (development) or your production URL
- **Redirect URLs**: 
  - `http://localhost:3000`
  - `http://localhost:3000/auth/callback`
  - Your production URLs

## 📁 Project Structure

```
src/
├── app/
│   ├── (main)/
│   │   └── login/
│   │       └── page.tsx              # Login page
│   ├── _components/
│   │   └── LoginJoinComponent.tsx    # Auth UI component
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts          # NextAuth handlers
├── server/
│   ├── auth.ts                       # Auth configuration
│   └── api/
│       ├── trpc.ts                   # tRPC context with auth
│       └── routers/
│           └── auth.ts               # Auth procedures
├── utils/
│   └── supabase/
│       ├── client.ts                 # Client-side Supabase
│       ├── server.ts                 # Server-side Supabase
│       └── middleware.ts             # Session refresh
├── lib/
│   └── auth-helpers.ts               # Auth utility functions
├── hooks/
│   └── useAuth.ts                    # Auth React hooks
├── stores/
│   └── auth.ts                       # Zustand auth store
├── providers/
│   └── auth-provider.tsx             # Auth context provider
└── middleware.ts                     # Next.js middleware
```

## 🔐 Authentication Flow

### Sign Up Flow
1. User fills out email, password, and username
2. Client calls `supabase.auth.signUp()` with user metadata
3. Supabase creates auth user
4. Client calls `api.auth.createUser` tRPC mutation
5. Server creates user record in Prisma database
6. Server creates associated profile (ClientProfile or VendorProfile)
7. Server creates wallet for user
8. User receives verification email

### Sign In Flow
1. User enters email/username and password
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials and returns session
4. Middleware refreshes session on each request
5. tRPC context fetches user profile from database
6. Profile is synced to Zustand store via AuthProvider

## 🛠️ Usage Examples

### Using the Auth Hook

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, signOut, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Pages

```tsx
"use client";

import { useRequireAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { user, loading } = useRequireAuth();

  if (loading) return <div>Loading...</div>;

  return <div>Protected content for {user?.username}</div>;
}
```

### Using tRPC Auth Procedures

```tsx
"use client";

import { api } from "@/trpc/react";

export function AuthExample() {
  const { data: session } = api.auth.getSession.useQuery();
  const checkUsername = api.auth.checkUsername.useQuery(
    { username: "myusername" },
    { enabled: false }
  );

  return (
    <div>
      {session ? `Logged in as ${session.email}` : "Not logged in"}
    </div>
  );
}
```

### Protected tRPC Procedures

```typescript
// In your router file
export const myRouter = createTRPCRouter({
  // Public procedure - no auth required
  publicEndpoint: publicProcedure.query(() => {
    return { message: "Hello, world!" };
  }),

  // Protected procedure - requires authentication
  privateEndpoint: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to exist here
    return { 
      message: `Hello, ${ctx.user.username}!`,
      userId: ctx.user.id 
    };
  }),
});
```

## 🔧 Key Components

### Middleware (`src/middleware.ts`)
- Automatically refreshes Supabase sessions on each request
- Runs on all routes except static files and images

### tRPC Context (`src/server/api/trpc.ts`)
- Fetches Supabase user on each request
- Looks up user profile from Prisma database
- Provides `ctx.user` to all procedures

### Auth Store (`src/stores/auth.ts`)
- Client-side Zustand store for user profile
- Synced by AuthProvider component

### Auth Provider (`src/providers/auth-provider.tsx`)
- Fetches user profile via tRPC
- Updates Zustand store with profile data
- Wraps app to provide auth context

## 📝 Available tRPC Procedures

### `auth.createUser`
Creates a new user in the database after Supabase signup.

**Input:**
```typescript
{
  id: string;        // Supabase user ID
  email: string;
  username: string;
  role: "CLIENT" | "VENDOR";
}
```

### `auth.checkUsername`
Checks if a username is available.

**Input:**
```typescript
{
  username: string;
}
```

**Output:**
```typescript
{
  available: boolean;
}
```

### `auth.checkEmail`
Checks if an email exists in the database.

**Input:**
```typescript
{
  email: string;
}
```

**Output:**
```typescript
{
  exists: boolean;
}
```

### `auth.getSession`
Gets the current authenticated user.

**Output:**
```typescript
User | null
```

### `auth.signOut`
Server-side sign out cleanup (protected procedure).

## 🎨 UI Components

### LoginJoinComponent
Full-featured auth modal with:
- Email/password sign in
- Email/password sign up with username
- Role selection (Client/Vendor)
- Social auth placeholders (Google, Apple, Facebook)
- Multi-step flow with animations
- Loading states and error handling

## 🚨 Important Notes

1. **User Sync**: After Supabase signup, you must call `api.auth.createUser` to sync the user to your database.

2. **Email Verification**: Supabase sends verification emails by default. Configure email templates in Supabase dashboard.

3. **Session Management**: Sessions are automatically refreshed by the middleware. No manual token management needed.

4. **Role-Based Access**: User roles (CLIENT/VENDOR) are stored in both Supabase metadata and Prisma database.

5. **Profile Creation**: ClientProfile or VendorProfile is automatically created based on the user's role during signup.

6. **Wallet Creation**: A wallet is automatically created for each new user.

## 🐛 Troubleshooting

### "User not found in database"
- Make sure you called `api.auth.createUser` after Supabase signup
- Check that the Supabase user ID matches the database user ID

### Session not persisting
- Verify middleware is running (check `src/middleware.ts`)
- Check that cookies are enabled in browser
- Ensure NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set correctly

### tRPC context user is null
- Verify the user exists in your Prisma database
- Check that the Supabase session is valid
- Ensure middleware is refreshing sessions

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [tRPC Docs](https://trpc.io/docs)
