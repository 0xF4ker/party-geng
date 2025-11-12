# Party-Geng Feature Implementation Guide

This document provides implementation details for the requested features in the Party-Geng platform.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Paystack Integration](#paystack-integration)
3. [Earnings Page](#earnings-page)
4. [Settings Page - Payment Methods](#settings-page)
5. [Manage Orders Page](#manage-orders-page)
6. [Category & Service Pages](#category-service-pages)
7. [Gig Detail Page](#gig-detail-page)
8. [Category Carousel](#category-carousel)
9. [Mobile Menu](#mobile-menu)
10. [Inbox Page](#inbox-page)

---

## 1. Environment Setup

### Add Paystack Environment Variables

Add the following to your `.env` file:

```env
# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Install Dependencies

If not already installed:

```bash
npm install @paystack/inline-js
```

---

## 2. Paystack Integration

### Backend Implementation ✅ COMPLETED

The payment router has been updated with:
- `initializePayment` - Initialize Paystack payment
- `verifyPayment` - Verify payment and update wallet
- `getTransactions` - Get transaction history
- `initiateWithdrawal` - Withdraw funds to bank account

**File:** `src/server/api/routers/payment.ts`

### Frontend Components ✅ CREATED

**AddFundsModal Component**
- Location: `src/app/_components/payments/AddFundsModal.tsx`
- Handles adding funds via Paystack

---

## 3. Earnings Page

### Current Status
- ✅ Payment router created with Paystack integration
- ✅ AddFundsModal component created
- ⏳ Need to integrate modal into earnings page
- ⏳ Need to connect to real wallet data
- ⏳ Need to display real transactions

### Implementation Steps

1. **Import Required Components**

```typescript
import { AddFundsModal } from "@/app/_components/payments/AddFundsModal";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
```

2. **Replace Mock Data with Real Data**

Update the `EarningsPage` component:

```typescript
const EarningsPage = () => {
  const { profile } = useAuthStore();
  const userType = profile?.role === "VENDOR" ? "vendor" : "client";
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  
  // Fetch real data
  const { data: wallet } = api.payment.getWallet.useQuery();
  const { data: transactions } = api.payment.getTransactions.useQuery({
    limit: 20,
    offset: 0,
  });

  // Calculate balances
  const availableBalance = wallet?.availableBalance || 0;
  const clearingBalance = wallet?.clearingBalance || 0;
  const activeOrderBalance = wallet?.activeOrderBalance || 0;
  
  // ... rest of component
```

3. **Update AvailableFundsCard**

Modify to show real data and add "Add Funds" button for clients:

```typescript
<AvailableFundsCard
  userType={userType}
  availableBalance={availableBalance}
  onAddFunds={() => setShowAddFundsModal(true)}
  onWithdraw={() => {/* Handle withdrawal */}}
/>
```

4. **Update TransactionTable**

Pass real transactions:

```typescript
<TransactionTable transactions={transactions || []} />
```

5. **Add Modal to Page**

At the end of the return statement:

```typescript
{showAddFundsModal && (
  <AddFundsModal
    onClose={() => setShowAddFundsModal(false)}
    onSuccess={() => {
      /* Refetch wallet data */
    }}
  />
)}
```

---

## 4. Settings Page - Payment Methods

### Implementation

The `PaymentSettings` component needs to be enhanced to allow users to:
- Add bank account details for withdrawals
- Save payment methods for quick checkout
- View saved payment methods

**Update `src/app/(main)/settings/page.tsx`:**

```typescript
const PaymentSettings = () => {
  const [savedCards, setSavedCards] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  
  // Fetch saved payment methods
  const { data: paymentMethods } = api.payment.getSavedMethods.useQuery();
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Bank Account Section (for vendors) */}
        {profile?.role === "VENDOR" && (
          <BankAccountSection />
        )}
        
        {/* Saved Cards Section */}
        <SavedCardsSection />
        
        {/* Add Payment Method Button */}
        <button
          onClick={() => setShowAddFundsModal(true)}
          className="w-full rounded-md border-2 border-dashed border-gray-300 p-6 text-center hover:border-pink-500"
        >
          <CreditCard className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 font-medium text-gray-600">
            Add Payment Method
          </p>
        </button>
      </div>
    </div>
  );
};
```

---

## 5. Manage Orders Page

### Current Status
- ⏳ Uses mock data
- ⏳ Needs tRPC integration

### Implementation

1. **Update API Calls**

```typescript
const OrdersPage = () => {
  const { profile } = useAuthStore();
  const isVendor = profile?.role === "VENDOR";
  
  // Fetch orders based on role
  const { data: orders } = api.order.getMyOrders.useQuery();
  
  // Group orders by status
  const newLeads = orders?.filter(o => o.quote?.status === "PENDING") || [];
  const active = orders?.filter(o => o.status === "ACTIVE") || [];
  const completed = orders?.filter(o => o.status === "COMPLETED") || [];
  const cancelled = orders?.filter(o => o.status === "CANCELLED") || [];
  
  // ... rest of component
};
```

2. **Create Order Router Queries**

Add to `src/server/api/routers/order.ts`:

```typescript
getMyOrders: protectedProcedure.query(async ({ ctx }) => {
  const isVendor = ctx.user.role === "VENDOR";
  
  return ctx.db.order.findMany({
    where: isVendor 
      ? { vendorId: ctx.user.id }
      : { clientId: ctx.user.id },
    include: {
      vendor: {
        select: {
          username: true,
          vendorProfile: {
            select: {
              companyName: true,
              avatarUrl: true,
            },
          },
        },
      },
      client: {
        select: {
          username: true,
          clientProfile: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      gig: {
        include: {
          service: true,
        },
      },
      quote: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}),
```

---

## 6. Category & Service Pages

### Category Page (`categories/[category]/page.tsx`)

**Implementation:**

1. **Fetch Categories from Database**

```typescript
const CategoryPage = ({ params }: { params: Promise<{ category: string }> }) => {
  const { category: slug } = use(params);
  
  // Fetch category from database
  const { data: category } = api.category.getBySlug.useQuery({ slug });
  
  if (!category) {
    notFound();
  }
  
  return (
    // ... existing JSX
  );
};
```

2. **Add Category Router**

Create `src/server/api/routers/category.ts`:

```typescript
export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        services: true,
      },
    });
  }),
  
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Convert slug to name (e.g., "music-djs" -> "Music & DJs")
      const name = input.slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
        
      return ctx.db.category.findFirst({
        where: { name },
        include: {
          services: {
            include: {
              gigs: {
                where: { status: "ACTIVE" },
                take: 10,
              },
            },
          },
        },
      });
    }),
});
```

### Service Listing Page (`categories/[category]/[service]/page.tsx`)

**Implementation:**

1. **Fetch Gigs with Filters**

```typescript
const ServiceListingPage = ({ params }: Props) => {
  const { category, service } = use(params);
  const [filters, setFilters] = useState({
    eventType: [],
    sellerLevel: [],
    minBudget: 0,
    maxBudget: 0,
    eventDate: null,
  });
  
  // Fetch gigs with filters
  const { data: gigs } = api.gig.getByService.useQuery({
    categorySlug: category,
    serviceSlug: service,
    filters,
  });
  
  // ... render gigs
};
```

2. **Add Gig Router Queries**

```typescript
getByService: publicProcedure
  .input(z.object({
    categorySlug: z.string(),
    serviceSlug: z.string(),
    filters: z.object({
      minBudget: z.number().optional(),
      maxBudget: z.number().optional(),
      // ... other filters
    }).optional(),
  }))
  .query(async ({ ctx, input }) => {
    return ctx.db.gig.findMany({
      where: {
        status: "ACTIVE",
        service: {
          // Match service by slug
        },
        basePrice: {
          gte: input.filters?.minBudget,
          lte: input.filters?.maxBudget,
        },
      },
      include: {
        vendor: {
          include: {
            vendorProfile: true,
          },
        },
        service: {
          include: {
            category: true,
          },
        },
      },
    });
  }),
```

---

## 7. Gig Detail Page

**Implementation:**

```typescript
const GigDetailPage = ({ params }: Props) => {
  const { category, service, gig: gigId } = use(params);
  
  // Fetch gig details
  const { data: gig } = api.gig.getById.useQuery({ id: gigId });
  
  // Handle booking
  const createQuote = api.quote.create.useMutation({
    onSuccess: () => {
      toast.success("Quote request sent!");
      router.push("/inbox");
    },
  });
  
  const handleRequestQuote = () => {
    createQuote.mutate({
      gigId: gig.id,
      // ... quote details
    });
  };
  
  // ... render with real data
};
```

---

## 8. Category Carousel

**Implementation:**

The CategoryCarousel component in `src/app/_components/home/CategoryCarousel.tsx` already uses the local categories data. To connect it to the database:

```typescript
const CategoryCarousel = () => {
  // Fetch categories from database
  const { data: categories } = api.category.getAll.useQuery();
  
  return (
    <div className="relative container mx-auto">
      {/* ... render with real categories */}
    </div>
  );
};
```

---

## 9. Mobile Menu

### Implementation

Add the MobileMenu component to `src/app/_components/home/Header.tsx`:

```typescript
// After line 240, add the MobileMenu component
const MobileMenu = ({
  isOpen,
  onClose,
  isGuest,
  isVendor,
  openModal,
  signOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  isGuest: boolean;
  isVendor: boolean;
  openModal: (type: string) => void;
  signOut: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 lg:hidden"
      onClick={onClose}
    >
      <div
        className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="p-4">
          {isGuest ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  openModal("login");
                  onClose();
                }}
                className="w-full rounded-md border border-gray-300 p-3 text-left font-medium hover:bg-gray-50"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  openModal("join");
                  onClose();
                }}
                className="w-full rounded-md bg-pink-600 p-3 text-left font-medium text-white hover:bg-pink-700"
              >
                Join
              </button>
            </div>
          ) : isVendor ? (
            <div className="space-y-2">
              <Link
                href="/v/dashboard"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                Dashboard
              </Link>
              <Link
                href="/manage_orders"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                Orders
              </Link>
              <Link
                href="/earnings"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                Earnings
              </Link>
              <Link
                href="/settings"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full rounded-md p-3 text-left font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            // Client menu items
            <div className="space-y-2">
              <Link
                href="/manage_orders"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                My Orders
              </Link>
              <Link
                href="/settings"
                className="block rounded-md p-3 font-medium hover:bg-gray-50"
                onClick={onClose}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full rounded-md p-3 text-left font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};
```

---

## 10. Inbox Page

### Implementation

1. **Connect to Chat API**

```typescript
const InboxPage = () => {
  const { profile } = useAuthStore();
  
  // Fetch conversations
  const { data: conversations } = api.chat.getConversations.useQuery();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  
  // Fetch messages for selected conversation
  const { data: messages } = api.chat.getMessages.useQuery(
    { conversationId: selectedConvo! },
    { enabled: !!selectedConvo }
  );
  
  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Refetch messages
    },
  });
  
  // ... rest of implementation
};
```

2. **Add Chat Router**

Create `src/server/api/routers/chat.ts` if not exists:

```typescript
export const chatRouter = createTRPCRouter({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.conversation.findMany({
      where: {
        participants: {
          some: {
            id: ctx.user.id,
          },
        },
      },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),
  
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.message.findMany({
        where: {
          conversationId: input.conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              clientProfile: true,
              vendorProfile: true,
            },
          },
          quote: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }),
    
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      text: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          text: input.text,
        },
      });
    }),
});
```

---

## Implementation Priority

1. **High Priority**
   - ✅ Paystack integration (payment router)
   - ✅ AddFundsModal component
   - Complete Earnings page integration
   - Manage Orders page with real data

2. **Medium Priority**
   - Settings page payment section
   - Category/Service pages with database
   - Mobile Menu component

3. **Lower Priority**
   - Gig detail page enhancements
   - Inbox real-time features
   - Category carousel database integration

---

## Testing Checklist

- [ ] Test Paystack payment flow (sandbox mode)
- [ ] Verify wallet balance updates correctly
- [ ] Test transaction history display
- [ ] Verify order status changes
- [ ] Test quote creation and acceptance
- [ ] Test messaging functionality
- [ ] Test mobile menu navigation
- [ ] Verify all filters work on service listing page
- [ ] Test gig booking flow end-to-end

---

## Notes

- Always use Paystack sandbox keys during development
- Implement proper error handling for all API calls
- Add loading states for all async operations
- Ensure proper TypeScript typing throughout
- Follow existing code patterns and conventions
- Test on both mobile and desktop viewports
