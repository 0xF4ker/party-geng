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

interface RequestFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestFundsModal: React.FC<RequestFundsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [payerUsername, setPayerUsername] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");

  const requestMutation = api.payment.requestFunds.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Request failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (numAmount < 100) {
      toast.error("Minimum request amount is ₦100");
      return;
    }

    requestMutation.mutate({
      payerUsername,
      amount: numAmount,
      description,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Funds</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="payer">From (Username)</Label>
            <Input
              id="payer"
              placeholder="e.g. username"
              value={payerUsername}
              onChange={(e) => setPayerUsername(e.target.value)}
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
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
