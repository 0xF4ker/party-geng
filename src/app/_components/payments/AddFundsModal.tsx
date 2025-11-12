/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";

interface AddFundsModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuthStore();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const initializePayment = api.payment.initializePayment.useMutation({
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initialize payment");
      setIsProcessing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue < 100) {
      toast.error("Minimum amount is ₦100");
      return;
    }

    if (!profile?.email) {
      toast.error("Email not found");
      return;
    }

    setIsProcessing(true);
    initializePayment.mutate({
      amount: amountValue,
      email: profile.email,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="m-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Add Funds to Wallet</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Amount (₦)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
              min="100"
              step="100"
              required
              disabled={isProcessing}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum amount: ₦100</p>
          </div>

          <div className="mb-4 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              You will be redirected to Paystack to complete your payment
              securely.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Continue to Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
