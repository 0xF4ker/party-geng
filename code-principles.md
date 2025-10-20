# Code Principles

## 1. Component Structure

- **Atomic & Reusable**: Build small, single-purpose components.
- **File Naming**: `PascalCase.jsx` (e.g., `ServiceCard.jsx`).
- **Styling**: Use CSS Modules or a designated CSS-in-JS solution for component-scoped styles. Global styles are minimal.

## 2. State Management

- **Local State**: `useState`, `useReducer`.
- **Global State**: React Context or Zustand. Avoid prop drilling.

## 3. Best Practices

- **TypeScript**: Use TypeScript for all new components.
- **Accessibility (a11y)**: All components must be keyboard navigable, screen-reader friendly (semantic HTML, ARIA), and meet WCAG AA color contrast.
- **Performance**: Lazy load non-critical components and optimize renders with `React.memo` where necessary.
