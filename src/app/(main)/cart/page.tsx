"use client";

import React, { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart";
import { Loader2, ShoppingCart, Trash2, FileText, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ContributionType } from "@prisma/client";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const CartPage = () => {
  const { cart, isLoading, error, getCart, removeItem, checkout } =
    useCartStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    void getCart().finally(() => setIsInitialLoading(false));
  }, [getCart]);

  const handleRemoveItem = async (itemId: string) => {
    const promise = removeItem(itemId);
    toast.promise(promise, {
      loading: "Removing item...",
      success: "Item removed!",
      error: "Failed to remove item.",
    });
  };

  const handleCheckout = async () => {
    const promise = checkout();
    toast.promise(promise, {
      loading: "Processing payment...",
      success: (res) => {
        if (res.success) {
          return "Checkout successful! Your orders have been placed.";
        }
        throw new Error(res.error ?? "An unknown error occurred.");
      },
      error: (err: unknown) => (err instanceof Error ? err.message : "An unknown error occurred."),
    });
  };

  const totalCost =
    cart?.items?.reduce((acc, item) => {
      if (item.quote) return acc + item.quote.price;
      if (item.contributionType === "CASH" && item.amount)
        return acc + item.amount;
      return acc;
    }, 0) ?? 0;

  if (isInitialLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error) {
    return <div className="py-20 text-center text-red-500">{error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-gray-500">
        <Empty className="h-full w-full py-20">
          <EmptyHeader>
            <EmptyMedia>
              <ShoppingCart className="h-24 w-24 text-gray-400" />
            </EmptyMedia>
            <EmptyTitle>Your cart is empty</EmptyTitle>
            <EmptyDescription>
              Looks like you haven&apos;t added anything to your cart yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 lg:pt-32">
      <main className="container mx-auto px-4 pb-12">
        <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm"
              >
                {item.quote ? (
                  <>
                    <div className="rounded-lg bg-pink-100 p-3">
                      <FileText className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.quote.title}</p>
                      <p className="text-sm text-gray-500">
                        Quote from{" "}
                        {item.quote.vendor.vendorProfile?.companyName ??
                          item.quote.vendor.username}
                      </p>
                    </div>
                    <p className="font-bold">
                      ₦{item.quote.price.toLocaleString()}
                    </p>
                  </>
                ) : item.wishlistItem ? (
                  <>
                    <div className="rounded-lg bg-green-100 p-3">
                      <Gift className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.wishlistItem.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.contributionType === ContributionType.CASH
                          ? "Cash Contribution"
                          : "Promise Gift"}{" "}
                        for {item.wishlistItem.wishlist.event.title}
                      </p>
                    </div>
                    <p className="font-bold">
                      {item.contributionType === ContributionType.CASH
                        ? `₦${item.amount?.toLocaleString()}`
                        : "₦0"}
                    </p>
                  </>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-4 rounded-lg bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold">Cart Summary</h2>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total</span>
                <span>₦{totalCost.toLocaleString()}</span>
              </div>
              <Button
                className="w-full bg-pink-600 font-bold text-white hover:bg-pink-700"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
