# Partygeng: Logic & Architecture Plan

This document explains how the chosen tech stack (T3/tRPC, Supabase, Prisma, Zod, Zustand) fits together and where logic lives.

## 1. Core tech stack & roles

- **Next.js (App Router)** — routing (e.g., `app/inbox`, `app/[username]`), UI rendering (React Server Components), API endpoints.
- **tRPC** — API layer; frontend calls procedures (e.g., `vendorRouter.submitKyc`) that run on the server.
- **Prisma** — ORM used inside tRPC procedures (e.g., `prisma.user.create(...)`).
- **Zod** — validation layer used by tRPC for all incoming data.
- **Supabase (Postgres)** — primary database; Prisma connects to this.
- **Supabase Auth** — authentication (signup, login, session). Use `options.data` to pass metadata (e.g., role).
- **Supabase Realtime** — socket-style broadcasting for chat messages (leverages RLS).
- **Zustand** — client global state (session, inbox, etc.).

## 2. Plan: Foundation (Auth & Database)

### Auth (Sign-up flow)

- User opens `Loginjoincomponent.jsx`, selects role: `CLIENT` or `VENDOR`.
- They choose Google or email sign-up.
- Call `supabase.auth.signUp()` and include the chosen role inside `options.data` (metadata).

### User table sync (DB trigger)

- When a new user is added to Supabase's private `auth.users` table, a DB trigger runs.
- The trigger reads `id`, `email`, and `raw_user_meta_data` (role) and creates the corresponding row in the public `User` table (the table Prisma reads). This keeps public user rows in sync automatically.

### tRPC context & frontend auth store

- tRPC backend extracts the Supabase JWT on each request, resolves the session, and fetches the full user (including role) from the public `User` table so procedures know who is calling.
- Frontend: create `useAuthStore` (Zustand) to hold session and profile data (`User`, `VendorProfile`, etc.) after login.

## 3. Plan: Core API (tRPC routers)

Create a router per domain of the Prisma schema. Example root file:

- `app/server/api/root.ts`

Routers (examples):

- `userRouter` — `user.getMe`, `client.getProfile`, etc.
- `vendorRouter` — `vendor.submitKyc`, `vendor.updateProfile`.
- `gigRouter` — `gig.create`, `gig.update`, `gig.getById`.
- `eventRouter` — `event.create`, `event.getMine`, `wishlist.addItem`, `wishlist.toggleFulfilled`.
- `chatRouter` — `chat.getConversations`, `chat.sendMessage`.
- `quoteRouter` — `quote.create`, `quote.accept`, `quote.requestRevision`.
- `orderRouter` — `order.getByUser`.
- `paymentRouter` — `payment.getWallet`, `payment.createWithdrawalRequest`.

## 4. Plan: The core user flows (how pieces connect)

### A. Vendor onboarding & KYC (`SettingsPage.jsx`)

- Frontend checks `useAuthStore`: `user.role === 'VENDOR'` and `user.vendorProfile.kycStatus !== 'APPROVED'` → show activation banner and KYC form.
- User submits KYC form → call `vendorRouter.submitKyc`.
- tRPC validates with Zod, then updates via Prisma, e.g.:

  ```ts
  await prisma.vendorProfile.update({
    where: { userId: ctx.session.user.id },
    data: {
      fullName: input.fullName,
      cacNumber: input.cacNumber,
      businessAddress: input.address,
      kycStatus: "IN_REVIEW",
      // ...
    },
  });
  ```

### B. Inbox & realtime (`InboxPage.jsx`) — primary flow

- On load: fetch conversations:

  ```ts
  const { data: convos } = trpc.chatRouter.getConversations.useQuery();
  ```

  store them in `useChatStore` (Zustand).

- Subscribe to Supabase Realtime for new messages on selected conversation.
- Send message:

  ```ts
  const { mutate: sendMessage } = trpc.chatRouter.sendMessage.useMutation();
  sendMessage({ conversationId: "convo-123", text: "Hi!" });
  ```

- Server: `chatRouter.sendMessage` validates via Zod and writes:

  ```ts
  await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: ctx.session.user.id,
      text: input.text,
    },
  });
  ```

- Supabase Realtime detects the new row, checks RLS, and broadcasts the message JSON to subscribed clients. Frontend subscription updates `useChatStore` and the UI instantly.

### C. Chat → Quote → Order (InboxPage.jsx)

- Vendor clicks "Send Quote" → frontend calls `quoteRouter.createQuote`.
- Backend validates (Zod), creates `Quote` (linked to conversation, vendor, client) via Prisma, and also emits a chat message (e.g., via `chatRouter.sendMessage`) so client sees a QuoteBubble.
- Client accepts quote → frontend calls `orderRouter.createOrderFromQuote`. Typical server flow:
  - Redirect client to payment provider (e.g., Paystack).
  - On successful payment (webhook), create Order (`status: ACTIVE`), update Quote (`status: ACCEPTED`), create Transaction (`type: PAYMENT`), and update wallets:
    - vendor.wallet.activeOrderBalance += order.amount
    - client.wallet.expenses += order.amount

This maps frontend components (React, Zustand) to backend logic (tRPC, Zod, Prisma) and Supabase Realtime so the designed features behave predictably and securely.
