import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import { type AppRouter } from "@/server/api/root";

// Helper to get the base URL (Same as your React setup)
function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const client = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchStreamLink({
      transformer: SuperJSON,
      url: getBaseUrl() + "/api/trpc",
      headers: () => {
        const headers = new Headers();
        headers.set("x-trpc-source", "nextjs-vanilla"); // specific header for tracking
        return headers;
      },
    }),
  ],
});
