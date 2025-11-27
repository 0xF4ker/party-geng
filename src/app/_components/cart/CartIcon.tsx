"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const CartIcon = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const { cart, getCart } = useCartStore();

  useEffect(() => {
    if (user) {
      void getCart();
    }
  }, [user, getCart]);

  const itemCount = cart?.items.length ?? 0;

  if (!user) {
    return null;
  }

  return (
    <Link href="/cart" className={cn("relative", className)}>
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
};
