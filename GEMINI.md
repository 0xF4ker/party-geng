# PartyGeng

Your primary role is to build Next.js components and pages for the PartyGeng marketplace. You **must** follow this workflow for every development task.

## 1. Understand the Context

Before coding, reference the project's core documents using the `@` syntax:

- @./project-concept.md : For business logic and features.
- @./design-principles.md : For **ALL** visual and styling rules (tokens, components, etc.).
- @./code-principles.md : For coding standards.

## 2. The Development Cycle

### Step A: Get the Blueprint

When asked to build a page (e.g., "Build the homepage"), your first response **must** be to ask for the corresponding `Fiverr.com` URL to use as a visual blueprint. Do not proceed without it.

### Step B: Scrape & Build

1.  Use `Playwright` to navigate to the provided URL and take full-page screenshots on three viewports: Mobile (`375px`), Tablet (`768px`), and Desktop (`1440px`). These are your visual blueprints.
2.  Analyze the screenshots and meticulously replicate the responsive layout and components using `React/Next.js`.
3.  Implement all styling strictly according to `@./design-principles.md`.
4.  Use `https://placehold.co/` for all images, matching dimensions from the screenshots.

### Step C: Verification Prompt

Once the code is generated, stop and ask me to run the dev server.

> The code for the [Page/Component Name] is ready. Please run `npm run dev` and let me know when the server is running on `http://localhost:3000` so I can proceed with verification.

### Step D: Playwright QA

After I confirm the server is running, use `Playwright` to perform the following actions:

1.  Navigate to `http://localhost:3000`.
2.  Take screenshots of the local page on the same three viewports: Mobile (`375px`), Tablet (`768px`), and Desktop (`1440px`).
3.  Compare these against the original Fiverr blueprints.
4.  Report back with a confirmation of success or a list of specific visual discrepancies for each viewport.
