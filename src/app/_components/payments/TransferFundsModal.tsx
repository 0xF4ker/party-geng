"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}) => {
  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");

  const transferMutation = api.payment.transferFunds.useMutation({
    onSuccess: () => {
      toast.success("Transfer successful!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Transfer failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (numAmount < 100) {
      toast.error("Minimum transfer amount is ₦100");
      return;
    }

    if (numAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    transferMutation.mutate({
      recipientUsername,
      amount: numAmount,
      description,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient Username</Label>
            <Input
              id="recipient"
              placeholder="e.g. username"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
            />
            <p className="text-xs text-gray-500">
              Available: ₦{availableBalance.toLocaleString()}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={transferMutation.isPending}
            >
              {transferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
