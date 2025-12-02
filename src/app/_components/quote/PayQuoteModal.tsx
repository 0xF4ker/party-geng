"use client";

import React from "react";
import { Loader2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import Link from "next/link";

interface PayQuoteModalProps {
  quoteId: string;
  quoteTitle: string;
  quoteAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayQuoteModal = ({
  quoteId,
  quoteTitle,
  quoteAmount,
  isOpen,
  onClose,
  onSuccess,
}: PayQuoteModalProps) => {
  const { user } = useAuth();
  
  const { data: wallet, isLoading: isWalletLoading } = api.payment.getWallet.useQuery(undefined, {
      enabled: !!user,
  });

  const payForQuote = api.payment.payForQuote.useMutation({
      onSuccess: (data) => {
        if (data.success) {
            toast.success("Payment successful! Your order has been created.");
            onSuccess();
            onClose();
        } else if (data.reason === "INSUFFICIENT_FUNDS") {
            toast.error("Insufficient funds. Please top up your wallet.");
        } else {
            toast.error("Payment failed for an unknown reason.");
        }
      },
      onError: (error) => {
          toast.error(error.message ?? "Payment failed.");
      }
  });

  const handleSubmit = () => {
    if (!user) {
      toast.error("Please log in to pay.");
      return;
    }
    if (wallet && quoteAmount > wallet.availableBalance) {
        toast.error("Insufficient wallet balance.");
        return;
    }

    payForQuote.mutate({ quoteId });
  };

  const hasSufficientFunds = wallet && wallet.availableBalance >= quoteAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment for {quoteTitle}</DialogTitle>
          <DialogDescription>
            You are about to pay <strong>₦{quoteAmount.toLocaleString()}</strong> for this quote. The funds will be held in escrow until you confirm the order is complete.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
            <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your wallet balance:</span>
                    <span className="font-medium">
                        {isWalletLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `₦${wallet?.availableBalance.toLocaleString() ?? 0}`}
                    </span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">Amount to pay:</span>
                    <span>₦{quoteAmount.toLocaleString()}</span>
                </div>
                {!isWalletLoading && !hasSufficientFunds && (
                     <div className="flex justify-between text-sm font-bold text-red-500">
                        <span className="text-red-500">Deficit:</span>
                        <span>₦{(quoteAmount - (wallet?.availableBalance ?? 0)).toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>

        {!hasSufficientFunds && !isWalletLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div className="text-sm">
                    <p className="font-semibold text-yellow-800">You have insufficient funds to complete this transaction.</p>
                    <p className="text-yellow-700">Please top up your wallet to proceed.</p>
                </div>
            </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          {!hasSufficientFunds ? (
            <Button asChild>
                <Link href="/settings?tab=wallet">
                    <Wallet className="mr-2 h-4 w-4" />
                    Fund Wallet
                </Link>
            </Button>
          ) : (
            <Button
                type="button"
                onClick={handleSubmit}
                disabled={payForQuote.isPending || isWalletLoading}
            >
                {payForQuote.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                "Confirm & Pay"
                )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
