# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PartyGeng is a two-sided marketplace connecting event Clients with vetted Event Vendors. Built as a "service-as-a-product" platform similar to Fiverr, but specialized for the event industry. Users can be both Clients (default) and Vendors (requires KYC activation).

## Tech Stack

- **Next.js 15** (App Router) — React Server Components, routing
- **tRPC** — Type-safe API layer connecting frontend to backend
- **Prisma** — ORM for database access
- **Supabase** — PostgreSQL database + Auth + Realtime (for chat)
- **Zod** — Schema validation for all tRPC inputs
- **Zustand** — Client-side global state management
- **Tailwind CSS** — Styling with custom design tokens
- **TypeScript** — Strict mode enabled

## Common Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run preview          # Build and start production server
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run typecheck        # Run TypeScript compiler check
npm run check            # Run both lint and typecheck
npm run format:check     # Check Prettier formatting
npm run format:write     # Auto-format with Prettier
```

### Database
```bash
npm run db:generate      # Generate Prisma client and run migrations
npm run db:migrate       # Deploy migrations to production
npm run db:push          # Push schema changes (development)
npm run db:studio        # Open Prisma Studio GUI
```

**Important**: Always run `npm run lint` and `npm run typecheck` before committing changes.

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Main site routes
│   ├── inbox/             # Chat/messaging interface
│   ├── local/             # Local development routes
│   ├── api/               # API route handlers
│   └── _components/       # Shared page components
├── components/            # Reusable UI components
├── server/                # Backend logic
│   ├── api/
│   │   ├── routers/      # tRPC router definitions
│   │   ├── root.ts       # Main router aggregation
│   │   └── trpc.ts       # tRPC config, context, procedures
│   └── db.ts             # Prisma client singleton
├── stores/                # Zustand state stores
│   ├── auth.ts           # User authentication state
│   └── chat.ts           # Chat/conversation state
├── trpc/                  # tRPC client setup
├── lib/                   # Utility libraries
├── utils/                 # Helper functions
└── styles/                # Global styles
prisma/
└── schema.prisma          # Database schema
```

### Data Flow: Frontend → Backend

1. **Frontend**: Component calls tRPC hook
   ```typescript
   const { data } = api.gig.getById.useQuery({ id: "123" });
   const { mutate } = api.vendor.submitKyc.useMutation();
   ```

2. **tRPC Client** (`src/trpc/react.tsx`): Sends type-safe request to `/api/trpc`

3. **tRPC Context** (`src/server/api/trpc.ts`): 
   - Extracts Supabase session from cookies
   - Fetches full User record from database
   - Provides `ctx.db` (Prisma) and `ctx.user` to procedures

4. **Router** (`src/server/api/routers/*.ts`): 
   - Validates input with Zod schemas
   - Executes business logic using Prisma
   - Returns typed response

5. **Response**: Automatically serialized (SuperJSON) and type-checked

### Available tRPC Routers

All routers are aggregated in `src/server/api/root.ts`:

- `api.user.*` — User profile operations
- `api.vendor.*` — Vendor profile, KYC submission
- `api.gig.*` — Service package CRUD
- `api.chat.*` — Conversations and messaging
- `api.quote.*` — Quote creation, acceptance, revision
- `api.order.*` — Order management
- `api.event.*` — Client event and wishlist management
- `api.payment.*` — Wallet and transaction operations

### Authentication Flow

1. **Sign-up**: User selects role (`CLIENT` or `VENDOR`) and authenticates via Supabase Auth
2. **DB Trigger**: Automatically creates corresponding row in `User` table with role metadata
3. **Session**: Supabase JWT stored in httpOnly cookies
4. **Context**: Each tRPC request extracts user from JWT and fetches full profile
5. **Frontend State**: `useAuthStore` (Zustand) holds current user profile

**Protected Routes**: Use `protectedProcedure` in tRPC routers to require authentication.

### Database Schema (Key Models)

**Core Entities:**
- `User` — Central user model (links to Supabase Auth)
  - `role`: `CLIENT` | `VENDOR`
  - One-to-one: `ClientProfile`, `VendorProfile`, `Wallet`

- `VendorProfile` — Public profile + private KYC data
  - `kycStatus`: `PENDING` | `IN_REVIEW` | `APPROVED` | `REJECTED`
  - Vendors must complete KYC to activate service listings

- `Gig` — Vendor's service package
  - Linked to `Service` and `Category`
  - Contains pricing, gallery, add-ons

**Transaction Flow:**
- `Conversation` → `Message` (with Supabase Realtime)
- `Quote` → `Order` (on client acceptance + payment)
- `Order` → `Transaction` (escrow, payout, refund)
- `Order` → `Review` (post-completion)

**Event Management:**
- `ClientEvent` → `Wishlist` → `WishlistItem` → `WishlistPromise`
- Clients can create events and invite vendors to a group chat

### State Management (Zustand)

**`useAuthStore`** (`src/stores/auth.ts`):
- Holds current user profile (User + VendorProfile/ClientProfile)
- Set after successful authentication

**`useChatStore`** (`src/stores/chat.ts`):
- Manages conversations and messages
- Updated via tRPC queries and Supabase Realtime subscriptions

### Real-time Chat Architecture

1. **Fetch conversations**: `api.chat.getConversations.useQuery()` → stored in `useChatStore`
2. **Subscribe**: Connect to Supabase Realtime on selected conversation
3. **Send message**: `api.chat.sendMessage.useMutation()` → inserts via Prisma
4. **Broadcast**: Supabase Realtime detects insert, checks RLS, broadcasts to subscribers
5. **Update UI**: Realtime listener calls `useChatStore.addMessage()`

## Design System

**IMPORTANT**: This project follows a strict design token system. Always reference the design tokens defined in `style-guide.md` and `design-principles.md`.

### Key Design Principles

1. **Typography**: All text uses the `Quicksand` font family
   - Headings: `sys.font.heading.1` (60px), `sys.font.heading.2` (48px), `sys.font.heading.3` (30px)
   - Body: `sys.font.body.default` (16px)

2. **Colors**: Always use semantic system tokens (`sys.color.*`)
   - Primary: Pink (`#ec4899`)
   - Secondary: Purple (`#7c3aed`)
   - Brand gradient: `linear-gradient(to right, var(--sys-color-primary-default), var(--sys-color-secondary-default))`

3. **Spacing**: 8px base scale (`sys.space.*`)
   - `sys.space.2` = 8px, `sys.space.4` = 16px, `sys.space.6` = 32px

4. **Border Radius**: 
   - Default: `sys.radius.default` (12px)
   - Circular: `sys.radius.full` (9999px)

5. **Placeholders**: Use `https://placehold.co/{width}x{height}` for development images

### Component Patterns (from style-guide.md)

- **Service Card**: Photography-led, entire card is clickable, clear hover state
- **User Profile**: Circular avatars for individuals, square for agencies
- **Dashboards**: Seller (Shopify-inspired, data-dense), Buyer (Airbnb-inspired, card-based)
- **Accessibility**: WCAG AA compliance required — keyboard navigation, ARIA labels, color contrast

## Code Principles (from code-principles.md)

1. **TypeScript-first**: All new code must use TypeScript
2. **Component Structure**: Atomic, single-purpose components
3. **File Naming**: `PascalCase.tsx` for components
4. **State**: Local state via hooks, global via Zustand (avoid prop drilling)
5. **Accessibility**: All components must be keyboard navigable and screen-reader friendly

## Environment Variables

Required environment variables (see `src/env.js` for validation schema):

```bash
DATABASE_URL=              # Supabase Postgres connection string
DIRECT_URL=                # Supabase direct connection (for migrations)
NEXT_PUBLIC_SUPABASE_URL=  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
NODE_ENV=                  # development | test | production
```

## Critical Workflows

### Vendor Onboarding
1. User signs up as `VENDOR` role
2. System creates `User` + `VendorProfile` (via DB trigger)
3. Vendor completes KYC form (`kycStatus: PENDING` → `IN_REVIEW`)
4. Admin approval required before vendor can list services
5. Vendor creates `Gig` (service packages with pricing tiers)

### Booking Flow
1. Client browses gigs → initiates contact → creates `Conversation`
2. Vendor sends `Quote` (itemized offer)
3. Client accepts → payment processed (escrow)
4. `Order` created (`status: ACTIVE`), funds held in `vendor.wallet.activeOrderBalance`
5. Event occurs → client marks complete
6. Funds released to `vendor.wallet.availableBalance` (minus platform fee)
7. Both parties leave `Review`

## Testing

**Note**: Playwright is installed as a dependency but no test scripts are currently configured in `package.json`. To add tests, create a `playwright.config.ts` and add test scripts.

## Important Notes

1. **Never commit without linting/typechecking**: Always run `npm run check` before committing
2. **Supabase Realtime**: Used exclusively for chat — all other real-time needs should use tRPC subscriptions
3. **Database migrations**: Use `npm run db:generate` in development, `npm run db:migrate` for production
4. **tRPC procedures**: Use `protectedProcedure` for authenticated routes, `publicProcedure` for public endpoints
5. **Design tokens**: Always reference `style-guide.md` — never hardcode colors, spacing, or typography values
6. **Path aliases**: Use `@/*` to import from `src/` (configured in `tsconfig.json`)
