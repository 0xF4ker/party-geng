# Design principles and style guide

This document is the single source of truth for all UI. All generated code must strictly follow the tokens and patterns defined here.

## Brand logo

- Text: "PartyGeng"
- Format: typography only — no image.
- Style: base on `sys.font.heading.2`. Apply primary gradient:
  `linear-gradient(to right, var(--sys-color-primary-default), var(--sys-color-secondary-default))`.

## Design tokens (summary)

Always use the semantic system tokens (`sys.*`).
.

### Colors (`sys.color.*`)

- `background.default` — main page background. :
- `background.surface` — card / modal background.
- `text.default` — primary text.
- `text.muted` — secondary text.
- `border.default` — default borders.
- `primary.default` — main actions (Pink: `#ec4899`).
- `secondary.default` — accents (Purple: `#7c3aed`).
- `destructive.default` — destructive actions.
- `interactive.ring` — focus rings.

### Typography (`sys.font.*`)

- Font family: Quicksand.
- Headings: `heading.1` (60px, Bold) → `heading.3` (30px, Bold).
- Body: `body.default` (16px, Regular).
- Caption: `caption` (14px, Medium).

### Spacing (`sys.space.*`)

- Use an 8px base scale.
- Example: `sys.space.2 = 8px`, `sys.space.4 = 16px`.
- Apply this scale for margins, padding, and gaps.
  :

### Radius (`sys.radius.*`)

- `default`: 12px — cards and inputs.
- `full`: 9999px — avatars and fully rounded elements.

## Core component patterns

- Service card - Primary product display.
  - Must include media (placeholder), seller info, title, rating, and price.
  - The entire card is a single touch target and must have a hover state.
    :
- User profiles - Show avatar, stats (rating, jobs completed), verification badge, and reviews.
  - Design to build trust and clarity.
    :
- Dashboards
  - Seller: information-dense, Shopify-inspired.
  - Buyer: clean, card-based, Airbnb-inspired.

- "Create a service" flow
  - Multi-step process for sellers to define service details, pricing tiers, and gallery.
  - Mirror Fiverr’s workflow for clarity and conversion.

Follow these tokens and patterns for consistency across components and pages.
