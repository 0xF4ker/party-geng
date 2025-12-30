"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface WithdrawModalProps {
  onClose: () => void;
  availableBalance: number;
  onSuccess?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  onClose,
  availableBalance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const { data: banks, isLoading: loadingBanks } =
    api.payment.getBanks.useQuery(undefined, {
      staleTime: 1000 * 60 * 60,
    });

  const initiateWithdrawal = api.payment.initiateWithdrawal.useMutation({
    onSuccess: () => {
      toast.success(
        "Withdrawal initiated! Funds will be transferred to your account.",
      );
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate withdrawal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue < 1000) {
      toast.error("Minimum withdrawal amount is ₦1,000");
      return;
    }

    if (amountValue > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!bankCode || !accountNumber || !accountName) {
      toast.error("Please fill in all bank details");
      return;
    }

    initiateWithdrawal.mutate({
      amount: amountValue,
      bankCode,
      accountNumber,
      accountName,
    });
  };

  return (
    // Updated overlay classes: z-[100] to cover everything, including mobile nav
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
          <h3 className="text-lg font-bold text-gray-900">Withdraw Funds</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
            disabled={initiateWithdrawal.isPending}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Available Balance
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              ₦{availableBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (Min 1000)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                min="1000"
                step="100"
                required
                disabled={initiateWithdrawal.isPending}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Bank Name
              </label>
              <div className="relative">
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-8 text-sm transition outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  required
                  disabled={initiateWithdrawal.isPending || loadingBanks}
                >
                  <option value="">Select Bank</option>
                  {banks?.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                {loadingBanks && (
                  <div className="absolute top-2.5 right-8">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="10-digit account number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                required
                maxLength={10}
                disabled={initiateWithdrawal.isPending}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Must match bank records"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                required
                disabled={initiateWithdrawal.isPending}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={initiateWithdrawal.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={initiateWithdrawal.isPending}
            >
              {initiateWithdrawal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing
                </>
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
