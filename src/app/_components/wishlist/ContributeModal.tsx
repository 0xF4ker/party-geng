"use client";

import React, { useState } from "react";
import { Loader2, PartyPopper, Wallet, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContributionType } from "@prisma/client";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";

interface ContributeModalProps {
  itemId: string;
  eventName: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allowCashContribution: boolean;
}

export const ContributeModal = ({
  itemId,
  eventName,
  itemName,
  isOpen,
  onClose,
  onSuccess,
  allowCashContribution,
}: ContributeModalProps) => {
  const [guestName, setGuestName] = useState("");
  const [contributionType, setContributionType] = useState<ContributionType>(
    ContributionType.PROMISE,
  );
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  const { addItem, isLoading } = useCartStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }

    if (
      contributionType === ContributionType.CASH &&
      (amount === undefined || amount <= 0)
    ) {
      toast.error("Please enter a valid contribution amount.");
      return;
    }

    const promise = addItem({
      type: "WISHLIST_ITEM",
      wishlistItemId: itemId,
      contributionType,
      amount,
    });

    toast.promise(promise, {
      loading: "Adding to cart...",
      success: () => {
        onSuccess();
        onClose();
        return "Item added to cart!";
      },
      error: (err) =>
        err instanceof Error ? err.message : "Failed to add item.",
    });
  };

  React.useEffect(() => {
    if (isOpen && user?.username) {
      setGuestName(user.username);
    }
    if (!allowCashContribution) {
      setContributionType(ContributionType.PROMISE);
    }
  }, [isOpen, user, allowCashContribution]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* MOBILE STYLING STRATEGY:
       1. w-screen h-[100dvh]: Forces full width/height on mobile (dvh handles mobile browser bars).
       2. max-w-none: Removes default width constraints.
       3. rounded-none border-0: Makes it look like a native page.
       4. flex flex-col: Allows us to push the footer to the bottom.
       
       DESKTOP OVERRIDES (sm:):
       1. sm:h-auto: Returns to content-based height.
       2. sm:max-w-lg: Restricts width.
       3. sm:rounded-lg sm:border: Adds back the modal look.
    */}
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-w-lg sm:rounded-lg sm:border sm:p-6">
        {/* HEADER: Fixed at the top */}
        <DialogHeader className="p-6 pb-2 sm:p-0 sm:pb-4">
          <DialogTitle>Make a Wish Come True! ✨</DialogTitle>
          <DialogDescription>
            You&apos;re about to make {eventName}&apos;s day by contributing to
            their <strong>{itemName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* BODY: Scrollable area for form inputs */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between overflow-y-auto sm:block sm:h-auto sm:space-y-4"
        >
          <div className="flex-1 space-y-6 px-6 py-2 sm:space-y-4 sm:px-0 sm:py-0">
            {/* Guest Name Input */}
            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g., Jane Doe"
                required
                disabled={!!user}
                className="bg-gray-50/50" // Slight background for better contrast on mobile
              />
              <p className="text-xs text-gray-500">
                This name will be shown on the wishlist.
              </p>
            </div>

            {/* Contribution Type Toggle */}
            {allowCashContribution && (
              <div className="space-y-2">
                <Label>Contribution Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      contributionType === ContributionType.PROMISE
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setContributionType(ContributionType.PROMISE)
                    }
                    className="h-12 flex-1 sm:h-10" // Taller buttons for mobile touch targets
                  >
                    <PartyPopper className="mr-2 h-4 w-4" /> Promise
                  </Button>
                  <Button
                    type="button"
                    variant={
                      contributionType === ContributionType.CASH
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setContributionType(ContributionType.CASH)}
                    className="h-12 flex-1 sm:h-10"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> Cash
                  </Button>
                </div>
              </div>
            )}

            {/* Amount Input */}
            {contributionType === ContributionType.CASH && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount ?? ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g., 5000"
                  required
                  min={1}
                  className="text-lg" // Larger text for number entry on mobile
                />
              </div>
            )}
          </div>

          {/* FOOTER: Fixed at bottom on mobile, normal on desktop */}
          <DialogFooter className="mt-auto border-t bg-gray-50 p-6 sm:mt-0 sm:border-t-0 sm:bg-transparent sm:p-0">
            <div className="flex w-full gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-pink-600 text-white hover:bg-pink-700 sm:flex-none"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
