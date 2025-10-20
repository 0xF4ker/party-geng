# Party-Geng AI Agent Style Guide

This document serves as the single source of truth for the Party-Geng user interface. It defines the design principles, foundations, and component patterns necessary to build a cohesive, scalable, and trustworthy event staffing marketplace modeled after the "service-as-a-product" concept.

## I. Core Philosophy

Our design is guided by the principles of a modern e-commerce experience. We are not just listing freelancers; we are selling bookable, productized event services.

- **Trust is Paramount.** As a marketplace connecting strangers, every design decision must build confidence. We achieve this through transparent profiles, verified reviews, and secure, clear transaction flows.
- **Discovery is Effortless.** The experience for Planners (Buyers) should feel like shopping. The interface must be visual, intuitive, and optimized for browsing and quick purchasing, reducing the cognitive load of hiring.
- **Empowerment for Staff.** The experience for Event Staff (Sellers) should empower them to easily package, price, and sell their services. The dashboard is their command center for managing orders and growing their business.
- **Consistency is Key.** A unified design language across all parts of the platform—from the public marketplace to private dashboards—ensures a predictable and professional experience that reinforces our brand.

## II. Brand Identity

### A. Brand Logo

- **Name**: `PartyGeng`
- **Format**: The logo is always to be rendered as typography, not an image file.
- **Font**: Use a bold, modern font that complements `Quicksand`. Use `sys.font.heading.2` as a baseline for size and style.
- **Style**: The text must be styled with the primary brand gradient.
- **Gradient**: `linear-gradient(to right, var(--sys-color-primary-default), var(--sys-color-secondary-default))` (Pink-to-Purple).

## III. Design Tokens: The Single Source of Truth

Design tokens are the atomic values of our design system. They are the single source of truth that connects our design language to the code. We use a tiered system: Reference Tokens (the raw values) and System Tokens (the semantic application of those values).

### A. Token Naming Convention

Tokens follow a consistent structure: `[category].[property].[concept]?[modifier]?`. This makes the system predictable and scalable.

- **Category**: `color`, `font`, `space`, `radius`, `shadow`
- **Property**: `background`, `text`, `border`
- **Concept**: `primary`, `secondary`, `destructive`, `interactive`
- **Modifier**: `default`, `hover`, `disabled`, `subtle`

### B. Color Tokens

Our color system is designed for clarity, brand expression, and accessibility, with full support for both light and dark themes.

#### Reference Color Palette (`ref.color._`)

These are the raw color values available to the system.

| Token Name             | Light Mode Value | Dark Mode Value |
| ---------------------- | ---------------- | --------------- |
| `ref.color.pink.500`   | `#ec4899`        | `#ec4899`       |
| `ref.color.purple.500` | `#7c3aed`        | `#7c3aed`       |
| `ref.color.blue.500`   | `#3b82f6`        | `#3b82f6`       |
| `ref.color.red.500`    | `#ef4444`        | `#b91c1c`       |
| `ref.color.gray.900`   | `#111827`        | `#111827`       |
| `ref.color.gray.800`   | `#1f2937`        | `#1f2937`       |
| `ref.color.gray.700`   | `#374151`        | `#374151`       |
| `ref.color.gray.600`   | `#4b5563`        | `#4b5563`       |
| `ref.color.gray.500`   | `#6b7280`        | `#6b7280`       |
| `ref.color.gray.200`   | `#e5e7eb`        | `#e5e7eb`       |
| `ref.color.gray.100`   | `#f3f4f6`        | `#f3f4f6`       |
| `ref.color.gray.50`    | `#f9fafb`        | `#f9fafb`       |
| `ref.color.white`      | `#ffffff`        | `#ffffff`       |

#### System Color Tokens (`sys.color._`)

These tokens give semantic meaning to the reference colors. The AI agent should always use System Tokens in component construction.

| System Token                     | Light Mode Value       | Dark Mode Value        | Purpose                               |
| -------------------------------- | ---------------------- | ---------------------- | ------------------------------------- |
| `sys.color.background.default`   | `ref.color.gray.50`    | `ref.color.gray.900`   | Main page background                  |
| `sys.color.background.surface`   | `ref.color.white`      | `ref.color.gray.800`   | Card and Modal backgrounds            |
| `sys.color.background.muted`     | `ref.color.gray.100`   | `ref.color.gray.800`   | Subtle backgrounds, like input fields |
| `sys.color.text.default`         | `ref.color.gray.900`   | `ref.color.gray.50`    | Default body text                     |
| `sys.color.text.muted`           | `ref.color.gray.600`   | `ref.color.gray.500`   | Secondary or helper text              |
| `sys.color.border.default`       | `ref.color.gray.200`   | `ref.color.gray.700`   | Default borders for cards, inputs     |
| `sys.color.primary.default`      | `ref.color.pink.500`   | `ref.color.pink.500`   | Primary actions (e.g., "Order Now")   |
| `sys.color.primary.foreground`   | `ref.color.white`      | `ref.color.white`      | Text on primary backgrounds           |
| `sys.color.secondary.default`    | `ref.color.purple.500` | `ref.color.purple.500` | Secondary actions, accents            |
| `sys.color.secondary.foreground` | `ref.color.white`      | `ref.color.white`      | Text on secondary backgrounds         |
| `sys.color.destructive.default`  | `ref.color.red.500`    | `ref.color.red.700`    | Destructive actions (e.g., "Cancel")  |
| `sys.color.interactive.ring`     | `ref.color.pink.500`   | `ref.color.pink.500`   | Focus ring for interactive elements   |

### C. Typography Tokens

All text uses the `Quicksand` font family. The type scale provides a clear hierarchy for all content.

| System Token            | Font Size | Line Height | Font Weight     | Usage                        |
| ----------------------- | --------- | ----------- | --------------- | ---------------------------- |
| `sys.font.heading.1`    | `60px`    | `66px`      | `700 (Bold)`    | Hero titles                  |
| `sys.font.heading.2`    | `48px`    | `54px`      | `700 (Bold)`    | Page titles                  |
| `sys.font.heading.3`    | `30px`    | `38px`      | `700 (Bold)`    | Section titles, Card titles  |
| `sys.font.lead`         | `20px`    | `28px`      | `500 (Medium)`  | Introductory paragraphs      |
| `sys.font.body.default` | `16px`    | `24px`      | `400 (Regular)` | Main body text, descriptions |
| `sys.font.body.medium`  | `16px`    | `24px`      | `500 (Medium)`  | Emphasized body text, labels |
| `sys.font.caption`      | `14px`    | `20px`      | `500 (Medium)`  | Helper text, metadata        |
| `sys.font.footnote`     | `12px`    | `18px`      | `400 (Regular)` | Fine print, timestamps       |

### D. Spacing Tokens

We use a consistent spacing scale based on an `8px` base unit to create visual rhythm. All padding, margins, and gaps should use these tokens.

| Token         | Value  |
| ------------- | ------ |
| `sys.space.1` | `4px`  |
| `sys.space.2` | `8px`  |
| `sys.space.3` | `12px` |
| `sys.space.4` | `16px` |
| `sys.space.5` | `24px` |
| `sys.space.6` | `32px` |
| `sys.space.7` | `48px` |
| `sys.space.8` | `64px` |

### E. Sizing & Radius Tokens

| Token                | Value            | Usage                                            |
| -------------------- | ---------------- | ------------------------------------------------ |
| `sys.radius.default` | `0.75rem (12px)` | Default border radius for cards, modals, inputs. |
| `sys.radius.full`    | `9999px`         | For circular elements like avatars.              |

## IV. Core Component Patterns

These are the essential patterns for the Party-Geng marketplace. They should be built using the design tokens defined above.

### A. Service Card

The Service Card is the most important component for discovery. It is our "product" on the digital shelf.

- **Anatomy**:
  - **Container**: Uses `sys.color.background.surface` and `sys.radius.default`.
  - **Media**: A high-quality image or video is the primary focus for capturing user attention. As Airbnb has demonstrated, a photography-led design is paramount for selling an experience. For placeholder images during development, use `https://placehold.co/{width}x{height}` (e.g., `https://placehold.co/600x400`).
  - **Seller Info**: An Avatar component and the Seller's name.
  - **Title**: A short, compelling service title (e.g., "Certified Bartender for Corporate Events"). Uses `sys.font.heading.3` or `sys.font.lead`.
  - **Rating**: A star-based rating component and the number of reviews.
  - **Price**: Clearly displayed with a "Starting at" label.
  - **Interaction**: The entire card is a single, large touch target that navigates to the service detail page. It must have a clear hover state (e.g., a subtle lift using shadow).

### B. User Profile & Trust Elements

Trust is built through transparency. Profiles humanize our Sellers and give Buyers confidence.

- **Avatar**:
  - Use a circle (`sys.radius.full`) for individual freelancers. Use `https://placehold.co/100x100` for placeholder avatars.
  - Use a square (`sys.radius.default`) for agencies or companies.
  - This provides an immediate visual cue about who the seller is.
- **Profile Page**:
  - Must prominently display the seller's photo, name, and a short bio.
  - Show key stats: Star Rating, number of completed jobs, response time.
  - Include a **Verification Badge** for sellers who have completed identity checks. This is a critical trust signal.
  - Display a portfolio gallery of past work (high-quality images/videos). Use `https://placehold.co/400x300` for placeholder portfolio images.
  - Show detailed, verified reviews from past buyers.

### C. Dashboards

We have two distinct dashboard experiences: one for Buyers (Planners) and one for Sellers (Staff).

#### Seller Dashboard (The Command Center)

- **Purpose**: A professional tool for managing a business. Inspired by Shopify Polaris.
- **Layout**: Information-dense. Use a top navigation bar with dropdowns for categories like "Orders," "My Services," "Earnings," and "Analytics."
- **Key Components**:
  - An "Order Queue" table showing active, pending, and completed orders.
  - Data visualization cards for key metrics (e.g., total earnings, average selling price).
  - Easy access to the "Create a Service" workflow.

#### Buyer Dashboard (The Personal Hub)

- **Purpose**: A simple, personalized space for managing bookings. Inspired by Airbnb.
- **Layout**: Clean and card-based.
- **Key Components**:
  - A primary "My Orders" section showing cards for each booked service.
  - A "Saved Sellers" section.
  - Personalized recommendations for other services based on past bookings.

### D. "Create a Service" Workflow

This is the core flow for Sellers, directly inspired by Fiverr. It must be a guided, step-by-step process.

- **Overview**: Input Service Title, Category, and Search Tags.
- **Scope & Pricing**: A UI to define three packages (Basic, Standard, Premium) with fields for description, deliverables (e.g., hours of service), and price.
- **Description & FAQ**: A rich text editor for a detailed description.
- **Requirements**: A form where the Seller specifies what they need from the Buyer (e.g., "Event address, dress code").
- **Gallery**: An interface to upload high-quality photos and videos. This is the service's visual merchandising. Placeholder images should be generated using `https://placehold.co/` with appropriate dimensions.

## V. Content: Voice & Tone

Our voice is clear, encouraging, and professional.

- **For Buyers**: The tone is aspirational and straightforward, like a trusted e-commerce site. We help them find the perfect staff to make their event a success.
- **For Sellers**: The tone is empowering and business-focused. We provide the tools they need to build their freelance business.
- **Microcopy**: All button labels, error messages, and helper text should be concise and unambiguous. Avoid jargon.

## VI. Accessibility

Accessibility is a core requirement, not an afterthought. All components and patterns must adhere to WCAG AA standards.

- **Color Contrast**: All text and interactive elements must meet minimum contrast ratios against their backgrounds, in both light and dark modes.
- **Keyboard Navigation**: All interactive elements (buttons, links, inputs) must be fully navigable and operable using only a keyboard. Focus states must be clear and use the `sys.color.interactive.ring` token.
- **Screen Readers**: Use semantic HTML and provide appropriate ARIA attributes for all components to ensure they are understandable by screen reader users. All images must have descriptive alt text.

## VII. Gradient

- **Usage**: Gradients should be used purposefully to add depth and guide the user's eye.

- **Primary Gradient**: linear-gradient(to right, var(--primary-color), var(--secondary-color))

- **Application**: Ideal for hero sections, primary buttons, and highlight cards.
