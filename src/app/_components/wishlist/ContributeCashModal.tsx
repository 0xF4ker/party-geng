"use client";

import React, { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/trpc/react";

interface ContributeCashModalProps {
  itemId: string;
  eventName: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContributeCashModal = ({
  itemId,
  eventName,
  itemName,
  isOpen,
  onClose,
  onSuccess,
}: ContributeCashModalProps) => {
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  
  const { data: wallet, isLoading: isWalletLoading } = api.payment.getWallet.useQuery(undefined, {
      enabled: !!user,
  });

  const contribute = api.payment.contributeToWishlist.useMutation({
      onSuccess: () => {
          toast.success("Contribution successful!");
          onSuccess();
          onClose();
      },
      onError: (error) => {
          toast.error(error.message ?? "Contribution failed.");
      }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to contribute.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (wallet && amount > wallet.availableBalance) {
        toast.error("Insufficient wallet balance.");
        return;
    }

    contribute.mutate({
      wishlistItemId: itemId,
      amount: amount,
      guestName: user.username,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribute Cash to {itemName}</DialogTitle>
          <DialogDescription>
            You are contributing to the wishlist for {eventName}. Your wallet balance is <b>₦{wallet?.availableBalance.toLocaleString() ?? 0}</b>.
          </DialogDescription>
        </DialogHeader>
        <form id="cash-contribution-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              value={amount ?? ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g., 5000"
              required
              min={1}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="cash-contribution-form"
            disabled={contribute.isPending || isWalletLoading}
          >
            {contribute.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <><Wallet className="mr-2 h-4 w-4" />Confirm Contribution</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
