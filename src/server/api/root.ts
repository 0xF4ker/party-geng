import { authRouter } from "@/server/api/routers/auth";
import { userRouter } from "@/server/api/routers/user";
import { vendorRouter } from "@/server/api/routers/vendor";
import { chatRouter } from "@/server/api/routers/chat";
import { quoteRouter } from "@/server/api/routers/quote";
import { orderRouter } from "@/server/api/routers/order";
import { eventRouter } from "@/server/api/routers/event";
import { paymentRouter } from "@/server/api/routers/payment";
import { settingsRouter } from "@/server/api/routers/settings";
import { categoryRouter } from "@/server/api/routers/category";
import { wishlistRouter } from "@/server/api/routers/wishlist";
import { notificationRouter } from "@/server/api/routers/notification";
import { postRouter } from "@/server/api/routers/post";
import { reviewRouter } from "@/server/api/routers/review";
import { cartRouter } from "@/server/api/routers/cart";
import { invitationRouter } from "@/server/api/routers/invitation";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  vendor: vendorRouter,
  chat: chatRouter,
  quote: quoteRouter,
  order: orderRouter,
  event: eventRouter,
  payment: paymentRouter,
  settings: settingsRouter,
  category: categoryRouter,
  wishlist: wishlistRouter,
  notification: notificationRouter,
  post: postRouter,
  review: reviewRouter,
  cart: cartRouter,
  invitation: invitationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;


/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
