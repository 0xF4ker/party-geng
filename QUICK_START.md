# Quick Start Guide - Party-Geng Implementation

## What's Been Done ✅

1. **Paystack Payment Integration** - Complete backend for payments
2. **AddFundsModal Component** - UI for adding funds
3. **Payment Callback Page** - Handles Paystack redirects
4. **Documentation** - Comprehensive guides created

## What You Need To Do Next 📝

### Step 1: Environment Setup (5 minutes)

1. Copy `.env.example` to `.env` (if you haven't already)
2. Add your Paystack keys:
```env
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Get your sandbox keys from: https://dashboard.paystack.com/#/settings/developer

### Step 2: Test What's Working (10 minutes)

1. Start your dev server: `npm run dev`
2. The payment API routes are ready at `/api/trpc/payment.*`
3. Test the callback page by visiting: `http://localhost:3000/payment/callback?reference=test`

### Step 3: Choose Your Path

Pick ONE of these to start (easiest to hardest):

#### Option A: Earnings Page (Recommended - 30 mins)
**Why:** Backend is done, just needs UI integration
**File:** `src/app/(main)/earnings/page.tsx`
**What to do:**
1. Import AddFundsModal at the top
2. Replace `vendorData` and `clientData` with real wallet data
3. Replace mock `transactions` with real transactions
4. Add modal trigger buttons
5. Test the payment flow

**Code snippet to add:**
```typescript
// At the top of EarningsPage component
const { data: wallet } = api.payment.getWallet.useQuery();
const { data: transactions } = api.payment.getTransactions.useQuery({
  limit: 20,
  offset: 0,
});
```

See `IMPLEMENTATION_GUIDE.md` Section 3 for full details.

#### Option B: Manage Orders Page (45 mins)
**Why:** Users need to see their orders
**Files:** 
- `src/app/(main)/manage_orders/page.tsx`
- `src/server/api/routers/order.ts`

**What to do:**
1. Add `getMyOrders` query to order router (code in guide)
2. Replace mock data with API call
3. Make action buttons functional

See `IMPLEMENTATION_GUIDE.md` Section 5 for full details.

#### Option C: Mobile Menu (20 mins)
**Why:** Quick win, improves UX
**File:** `src/app/_components/home/Header.tsx`

**What to do:**
1. Copy the MobileMenu component from guide
2. Add it after line 240 in Header.tsx
3. Connect it to the hamburger button

See `IMPLEMENTATION_GUIDE.md` Section 9 for full code.

### Step 4: Keep Going

Once you finish one, move to the next. Recommended order:
1. Earnings Page ✅
2. Mobile Menu ✅
3. Manage Orders Page ✅
4. Service Listing Pages
5. Gig Detail Page
6. Inbox Messaging

## File Reference

### Need to Read
- `IMPLEMENTATION_GUIDE.md` - Detailed code examples for each feature
- `IMPLEMENTATION_STATUS.md` - What's done and what's pending

### Already Done (Don't modify unless needed)
- `src/server/api/routers/payment.ts`
- `src/app/_components/payments/AddFundsModal.tsx`
- `src/app/payment/callback/page.tsx`

### Need to Modify (Pick one to start)
- `src/app/(main)/earnings/page.tsx` ⭐ START HERE
- `src/app/_components/home/Header.tsx` (Mobile Menu)
- `src/app/(main)/manage_orders/page.tsx`
- `src/app/(main)/settings/page.tsx` (Payment section)

### Need to Create
- `src/server/api/routers/category.ts`
- Components as needed

## Common Commands

```bash
# Start dev server
npm run dev

# Run database migrations (if you add new models)
npx prisma migrate dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Check TypeScript errors
npm run type-check
```

## Quick Troubleshooting

**"Module not found" error?**
- Make sure you're importing from the right path
- Check that the file actually exists

**tRPC error?**
- Make sure the router is exported in `src/server/api/root.ts`
- Check that you're calling the right procedure name

**Paystack error?**
- Verify your keys are in `.env`
- Use sandbox keys for testing
- Check the Paystack dashboard for logs

**Wallet not found?**
- The wallet is created automatically on first `getWallet` call
- Just call the query and it will create one if needed

## Need Help?

1. Check `IMPLEMENTATION_GUIDE.md` for detailed examples
2. Look at similar existing code in the codebase
3. Check console for error messages
4. Verify environment variables are set

## Testing Your Work

For each feature you implement:
1. Test as both CLIENT and VENDOR roles
2. Test on mobile viewport
3. Check console for errors
4. Verify data saves to database
5. Test error cases (what if API fails?)

## Estimated Time

- Earnings Page: 30-60 mins
- Mobile Menu: 20-30 mins  
- Manage Orders: 45-90 mins
- Category/Service Pages: 2-3 hours
- Gig Detail + Booking: 2-3 hours
- Inbox Messaging: 2-3 hours

**Total for all features: 8-12 hours** (spread across multiple days)

---

Remember: Start small, test often, and commit frequently! 🚀
