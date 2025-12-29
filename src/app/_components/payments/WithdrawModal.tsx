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

  // Fetch supported banks from Paystack via our API
  const { data: banks, isLoading: loadingBanks } =
    api.payment.getBanks.useQuery(undefined, {
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Withdraw Funds</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            disabled={initiateWithdrawal.isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="mb-2 text-sm text-gray-600">
              Available Balance:{" "}
              <span className="font-semibold text-gray-900">
                ₦{availableBalance.toLocaleString()}
              </span>
            </p>
          </div>

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
              min="1000"
              step="100"
              required
              disabled={initiateWithdrawal.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum: ₦1,000</p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="bankCode"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Bank
            </label>
            <div className="relative">
              <select
                id="bankCode"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white p-3 pr-8 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
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
                <div className="absolute top-3 right-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="accountNumber"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
              required
              maxLength={10}
              disabled={initiateWithdrawal.isPending}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="accountName"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Account Name
            </label>
            <input
              type="text"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Matches account number"
              className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
              required
              disabled={initiateWithdrawal.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must match your bank details exactly.
            </p>
          </div>

          <div className="mb-4 rounded-md bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Withdrawals are processed immediately. Ensure your account details
              are correct to avoid delays.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              disabled={initiateWithdrawal.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              disabled={initiateWithdrawal.isPending}
            >
              {initiateWithdrawal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Withdraw Funds"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
