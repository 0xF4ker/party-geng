import { create } from "zustand";
import { client } from "@/trpc/client";
import type { AppRouter, RouterInputs } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

type CartRouterOutput = inferRouterOutputs<AppRouter>["cart"];
type Cart = CartRouterOutput["get"];

type AddItemInput = RouterInputs["cart"]["addItem"];

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  getCart: () => Promise<void>;
  addItem: (item: AddItemInput) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  checkout: () => Promise<{ success: boolean; error?: string }>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  getCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const cart = await client.cart.get.query();
      set({ cart, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (item) => {
    // We will just refetch for now instead of doing a complex optimistic update
    set({ isLoading: true });
    try {
      await client.cart.addItem.mutate(item);
      await get().getCart();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      set({ error: message, isLoading: false });
      // Re-throw so toast.promise can catch it
      throw error;
    }
  },

  removeItem: async (cartItemId: string) => {
    const originalCart = get().cart;

    // Optimistic update
    set((state) => {
      if (!state.cart) return state;
      return {
        cart: {
          ...state.cart,
          items: state.cart.items.filter((item) => item.id !== cartItemId),
        },
      };
    });

    try {
      await client.cart.removeItem.mutate({ cartItemId });
    } catch {
      set({ cart: originalCart, error: "Failed to remove item from cart." });
    }
  },

  checkout: async () => {
    set({ isLoading: true });
    try {
      await client.cart.checkout.mutate();
      await get().getCart(); // Refresh the (now empty) cart
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during checkout.";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },
}));
