# Gig Removal and Service/Vendor Refactor Implementation Guide

This document outlines the steps to refactor the Party-Geng platform, removing the "Gig" entity and focusing on a direct "Service" to "Vendor" relationship.

## Table of Contents

- [Gig Removal and Service/Vendor Refactor Implementation Guide](#gig-removal-and-servicevendor-refactor-implementation-guide)
  - [Table of Contents](#table-of-contents)
  - [1. Project Goal](#1-project-goal)
  - [2. Key Changes](#2-key-changes)
  - [3. Database Schema Changes](#3-database-schema-changes)
  - [4. Backend API Changes (tRPC)](#4-backend-api-changes-trpc)
  - [5. Frontend Component Changes](#5-frontend-component-changes)
  - [6. Obsolete Files and Components](#6-obsolete-files-and-components)
  - [7. Implementation Priority](#7-implementation-priority)
  - [8. Testing Checklist](#8-testing-checklist)

---

## 1. Project Goal

The primary goal is to simplify the user experience by removing the concept of "Gigs." Instead, clients will find vendors by searching for specific services. This change streamlines the process of connecting clients with vendors and simplifies the platform's core logic.

---

## 2. Key Changes

- **Gig Model Removal:** The `Gig` model will be removed from the database and all related logic will be refactored.
- **Vendor-Service Relationship:** A direct many-to-many relationship between `VendorProfile` and `Service` will be established.
- **Service Discovery:** Clients will browse services and see a list of vendors who offer that service.
- **Direct Vendor Contact:** From the service page, clients can navigate to a vendor's profile or message them directly.
- **Quotes based on Services:** Quotes will be created with one or more services, rather than being tied to a specific gig.

---

## 3. Database Schema Changes

**File:** `prisma/schema.prisma`

- **Remove `Gig` model:** The entire `Gig` model block will be deleted.
- **Remove `Gig` relations:**
  - Remove `gigs Gig[]` from the `Service` model.
  - Remove `gig Gig?` from the `Order` model.
  - Remove `gig Gig?` from the `Quote` model.
  - Remove `wishlistedGigs Gig[]` from the `Wishlist` model.
- **Create `ServicesOnVendors` join table:** This will create a many-to-many relationship between `VendorProfile` and `Service`.

```prisma
// ADD THIS MODEL
model ServicesOnVendors {
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id])
  vendorProfileId String
  service         Service       @relation(fields: [serviceId], references: [id])
  serviceId       String
  createdAt       DateTime      @default(now())

  @@id([vendorProfileId, serviceId])
}

// UPDATE VendorProfile MODEL
model VendorProfile {
  // ... existing fields
  services ServicesOnVendors[]
}

// UPDATE Service MODEL
model Service {
  // ... existing fields
  // REMOVE gigs Gig[]
  vendors ServicesOnVendors[]
}

// UPDATE Order MODEL
model Order {
  // ... existing fields
  // REMOVE gigId String?
  // REMOVE gig Gig? @relation(fields: [gigId], references: [id])
  // ADD services field if needed to itemize, or handle in quote
}

// UPDATE Quote MODEL
model Quote {
  // ... existing fields
  // REMOVE gigId String?
  // REMOVE gig Gig? @relation(fields: [gigId], references: [id])
  services Json // Or a new relation to a QuoteServiceItem model
}
```

---

## 4. Backend API Changes (tRPC)

- **`src/server/api/routers/gig.ts` -> `src/server/api/routers/vendor.ts`**
  - Delete `gig.ts`.
  - Move `getByService` logic to `vendor.ts` and rename it `getVendorsByService`. This new function will query vendors based on the `ServicesOnVendors` join table.
  - Create a new `findVendors` procedure in `vendor.ts` that can filter vendors by multiple services.

- **`src/server/api/routers/category.ts`**
  - Update `getBySlug` to no longer include `gigs`. Instead, it can fetch a count of vendors per service.

- **`src/server/api/routers/quote.ts`**
  - Modify `create` procedure to accept an array of `serviceIds` instead of a `gigId`.
  - Update `get` and other procedures to handle quotes with services.

- **`src/server/api/routers/order.ts`**
  - Modify `create` procedure (if it exists) and `getMyOrders` to reflect the removal of `gig`. The order details will now be sourced from the `Quote`.

- **`src/server/api/routers/chat.ts`**
  - Update `sendMessage` or related procedures if they reference gigs in messages (e.g., when creating a quote).

- **`src/server/api/routers/settings.ts`**
  - Add a new procedure `updateVendorServices` to allow vendors to add/remove services from their profile.

---

## 5. Frontend Component Changes

- **`src/app/(main)/categories/[category]/[service]/page.tsx`**
  - This page will now display a list of vendor profiles instead of gigs.
  - Fetch data using `api.vendor.getVendorsByService`.
  - Each item in the list will be a `VendorCard` component, linking to the vendor's public profile (`/v/[user]`).

- **`src/app/(main)/v/[user]/page.tsx` (Vendor Profile)**
  - This page becomes the primary showcase for a vendor.
  - Visually, it should be similar to the old `[gig]` page.
  - Display vendor's services as badges near their bio.
  - Implement "Gallery" and "Reviews" tabs.

- **`src/app/(main)/c/[user]/page.tsx` (Client Profile)**
  - Review to ensure no gig-related information is displayed. Minor changes expected.

- **`src/app/(main)/settings/page.tsx`**
  - Add a new section for vendors to manage their services.
  - This section should fetch all available services (`api.category.getAll`) and present them as a multi-select list or checkboxes.
  - On save, it will call `api.settings.updateVendorServices`.

- **`src/app/(main)/dashboard/page.tsx`**
  - Remove any sections related to creating or managing gigs (e.g., "My Gigs").

- **`src/app/inbox/page.tsx` & `src/app/(main)/manage_orders/page.tsx`**
  - Update UI to display service details within quotes and orders instead of gig details.

---

## 6. Obsolete Files and Components

The following files and components should be deleted after their logic has been migrated or is no longer needed:

- **File:** `src/app/(main)/categories/[category]/[service]/[gig]/page.tsx`
- **File:** `src/server/api/routers/gig.ts`
- **Component:** Any component specifically designed for displaying individual gigs in a list (a `GigCard` might be replaced with a `VendorCard`).

---

## 7. Implementation Priority

1.  **High Priority**
    - `prisma/schema.prisma`: Apply database changes and run migration.
    - `settings.ts` router & `settings` page: Allow vendors to add services.
    - `vendor.ts` router: Implement `getVendorsByService`.
    - `[service]/page.tsx`: Display vendors for a service.

2.  **Medium Priority**
    - `v/[user]/page.tsx`: Redesign vendor profile page using `c/[user]/page.tsx` as a template.
    - `quote.ts` router & Inbox: Update quote creation to use services.
    - `order.ts` router & `manage_orders` page: Update order management.

3.  **Lower Priority**
    - Delete obsolete files (`[gig]/page.tsx`, `gig.ts`).
    - `dashboard/page.tsx`: Clean up gig-related UI.
    - General code cleanup and refactoring.

---

## 8. Testing Checklist

- [ ] **Migration:** Database migration completes successfully.
- [ ] **Vendor Settings:** A vendor can successfully add and remove services from their profile.
- [ ] **Service Page:** The `[service]` page correctly lists all vendors who offer that service.
- [ ] **Vendor Profile:** The `/v/[user]` page displays the vendor's details and a list of their services.
- [ ] **Quote Creation:** A client can message a vendor and receive a quote that lists one or more services.
- [ ] **Order Creation:** An order is successfully created from an accepted quote.
- [ ] **Order Display:** The `manage_orders` page correctly displays order information without gig data.
- [ ] **Obsolete Pages:** The old `[gig]` page URL results in a 404 (or a redirect).
- [ ] **Search/Filter:** The `findVendors` endpoint correctly filters vendors by multiple services.
