# Gig and Quote Management System

This document explains the backend implementation for vendor gig and quote management functionality.

## Overview

The system allows vendors to:
- Create, update, and manage gigs (service offerings)
- Track gig statistics (impressions, clicks, quotes)
- Send and manage quotes to clients
- View dashboard statistics and performance metrics

## Backend Implementation

### 1. Database Schema (Prisma)

The following models are used:

- **Gig**: Service offerings created by vendors
- **GigAddOn**: Optional add-ons for gigs
- **Quote**: Quotes sent by vendors to clients
- **Category**: Service categories (Music & DJs, Food & Beverage, etc.)
- **Service**: Specific services within categories

### 2. API Routers

#### Gig Router (`src/server/api/routers/gig.ts`)

**Mutations:**
- `create` - Create a new gig with add-ons, FAQs, and gallery
- `update` - Update existing gig details
- `delete` - Delete a gig
- `updateStatus` - Change gig status (DRAFT, ACTIVE, PAUSED)

**Queries:**
- `getMyGigs` - Get all gigs for current vendor (with optional status filter)
- `getById` - Get single gig by ID (public)
- `getMyStats` - Get vendor dashboard statistics
- `getByVendorUsername` - Get active gigs for a vendor's public profile

#### Quote Router (`src/server/api/routers/quote.ts`)

**Mutations:**
- `create` - Create a new quote for a client
- `updateStatus` - Update quote status (PENDING, ACCEPTED, REJECTED, REVISION_REQUESTED)

**Queries:**
- `getMyQuotesAsVendor` - Get all quotes sent by vendor
- `getMyQuotesAsClient` - Get all quotes received by client
- `getById` - Get single quote details
- `getVendorQuoteStats` - Get quote statistics by status

#### Category Router (`src/server/api/routers/category.ts`)

**Queries:**
- `getAll` - Get all categories with services
- `getById` - Get single category
- `getServicesByCategory` - Get services for a specific category

### 3. Seeding Data

Run the category seed script to populate categories and services:

```bash
npx tsx prisma/seed-categories.ts
```

This creates 8 categories with 30+ services.

## Frontend Integration

### Using tRPC in Components

Import the `api` object from `@/trpc/react`:

```typescript
import { api } from "@/trpc/react";
```

### Example Usage

#### 1. Fetch Vendor Dashboard Stats

```typescript
const VendorDashboard = () => {
  const { data: stats, isLoading } = api.gig.getMyStats.useQuery();
  
  return (
    <div>
      <p>Pending Quotes: {stats?.pendingQuotes}</p>
      <p>Active Gigs: {stats?.activeGigs}</p>
      <p>Monthly Earnings: ₦{stats?.monthlyEarnings.toLocaleString()}</p>
    </div>
  );
};
```

#### 2. List Vendor's Gigs

```typescript
const ManageGigs = () => {
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const { data: gigs } = api.gig.getMyGigs.useQuery({ status });
  
  return (
    <div>
      {gigs?.map((gig) => (
        <div key={gig.id}>
          <h3>{gig.title}</h3>
          <p>₦{gig.basePrice.toLocaleString()}</p>
          <p>Quotes sent: {gig._count.quotes}</p>
        </div>
      ))}
    </div>
  );
};
```

#### 3. Create a New Gig

```typescript
const CreateGig = () => {
  const createGig = api.gig.create.useMutation();
  
  const handleSubmit = async (data: GigFormData) => {
    await createGig.mutateAsync({
      title: data.title,
      description: data.description,
      serviceId: data.serviceId,
      tags: data.tags,
      basePrice: data.basePrice,
      basePriceIncludes: data.baseIncludes,
      addOns: data.addOns,
      faqs: data.faqs,
      galleryImageUrls: data.images,
      youtubeUrl: data.videoUrl,
      status: "ACTIVE",
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

#### 4. Toggle Gig Status

```typescript
const GigCard = ({ gig }: { gig: Gig }) => {
  const utils = api.useUtils();
  const updateStatus = api.gig.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate and refetch gigs
      utils.gig.getMyGigs.invalidate();
    },
  });
  
  const handleToggle = () => {
    const newStatus = gig.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    updateStatus.mutate({ id: gig.id, status: newStatus });
  };
  
  return <button onClick={handleToggle}>Toggle Status</button>;
};
```

#### 5. Fetch Categories for Gig Creation

```typescript
const CategorySelect = () => {
  const { data: categories } = api.category.getAll.useQuery();
  
  return (
    <select>
      {categories?.map((cat) => (
        <optgroup key={cat.id} label={cat.name}>
          {cat.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
};
```

#### 6. Send a Quote

```typescript
const SendQuote = ({ clientId, gigId, conversationId }: QuoteProps) => {
  const sendQuote = api.quote.create.useMutation();
  
  const handleSendQuote = async () => {
    await sendQuote.mutateAsync({
      gigId,
      clientId,
      conversationId,
      title: "Wedding DJ Service",
      price: 250000,
      eventDate: new Date("2024-12-25"),
      includes: ["4 hours DJ service", "Sound system", "MC"],
    });
  };
  
  return <button onClick={handleSendQuote}>Send Quote</button>;
};
```

#### 7. Fetch Pending Quotes

```typescript
const QuotesList = () => {
  const { data: quotes } = api.quote.getMyQuotesAsVendor.useQuery({
    status: "PENDING",
  });
  
  return (
    <div>
      {quotes?.map((quote) => (
        <div key={quote.id}>
          <p>{quote.client.username}</p>
          <p>{quote.title} - ₦{quote.price.toLocaleString()}</p>
          <p>Event: {quote.eventDate.toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};
```

## UI Pages to Update

### 1. Dashboard Page (`src/app/(main)/v/dashboard/page.tsx`)
- Replace mock data with `api.gig.getMyStats.useQuery()`
- Fetch pending quotes with `api.quote.getMyQuotesAsVendor.useQuery({ status: "PENDING" })`
- Fetch active orders from orders API

### 2. Manage Gigs Page (`src/app/(main)/v/manage_gigs/page.tsx`)
- Use `api.gig.getMyGigs.useQuery({ status })` for gig list
- Implement status toggle with `api.gig.updateStatus.useMutation()`
- Implement delete with `api.gig.delete.useMutation()`

### 3. Create Gig Page (`src/app/(main)/v/manage_gigs/new/page.tsx`)
- Fetch categories with `api.category.getAll.useQuery()`
- Submit form with `api.gig.create.useMutation()`
- Handle image uploads separately (file upload service needed)

### 4. Vendor Profile Page (`src/app/(main)/v/[user]/page.tsx`)
- Fetch vendor profile data
- Use `api.gig.getByVendorUsername.useQuery({ username })`
- Fetch reviews from reviews API

## Next Steps

1. **Run the seed script** to populate categories:
   ```bash
   npx tsx prisma/seed-categories.ts
   ```

2. **Update UI pages** with real API integration (one example provided below)

3. **Implement file upload** for gig images (consider using Uploadthing or similar)

4. **Add error handling** and loading states to all queries/mutations

5. **Implement real-time updates** for quotes using WebSocket/Pusher (optional)

6. **Add analytics tracking** for gig impressions and clicks

## Security Notes

- All vendor-specific routes use `protectedProcedure` which requires authentication
- Ownership verification is performed before update/delete operations
- Public routes (like `getById`) only expose necessary information
- Quote access is restricted to vendors and clients involved in the quote

## Type Safety

All API calls are fully type-safe thanks to tRPC. TypeScript will:
- Autocomplete available procedures
- Validate input parameters
- Infer return types
- Catch errors at compile time

Example:
```typescript
// ✅ Type-safe - TypeScript knows the shape of the data
const { data } = api.gig.getMyGigs.useQuery({ status: "ACTIVE" });
//    ^? data: Gig[] | undefined

// ❌ Type error - Invalid status value
api.gig.getMyGigs.useQuery({ status: "INVALID" });
```
