import { authRouter } from "@/server/api/routers/auth";
import { userRouter } from "@/server/api/routers/user";
import { vendorRouter } from "@/server/api/routers/vendor";
import { gigRouter } from "@/server/api/routers/gig";
import { chatRouter } from "@/server/api/routers/chat";
import { quoteRouter } from "@/server/api/routers/quote";
import { orderRouter } from "@/server/api/routers/order";
import { eventRouter } from "@/server/api/routers/event";
import { paymentRouter } from "@/server/api/routers/payment";
import { settingsRouter } from "@/server/api/routers/settings";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  vendor: vendorRouter,
  gig: gigRouter,
  chat: chatRouter,
  quote: quoteRouter,
  order: orderRouter,
  event: eventRouter,
  payment: paymentRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
