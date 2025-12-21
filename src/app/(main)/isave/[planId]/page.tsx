"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Target,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  History,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PlanDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const {
    data: plan,
    isLoading,
    refetch,
  } = api.savePlan.getById.useQuery({ id: planId });

  const depositMutation = api.savePlan.deposit.useMutation({
    onSuccess: () => {
      toast.success("Deposit successful!");
      setDepositAmount("");
      setIsDepositModalOpen(false);
      void refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const breakPlanMutation = api.savePlan.breakPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan broken successfully. Funds returned to wallet.");
      router.push("/isave");
    },
    onError: (error) => toast.error(error.message),
  });

  const withdrawCompletedMutation =
    api.savePlan.withdrawCompletedPlan.useMutation({
      onSuccess: () => {
        toast.success("Funds withdrawn to wallet successfully!");
        void refetch();
      },
      onError: (error) => toast.error(error.message),
    });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex h-screen items-center justify-center">
        Plan not found.
      </div>
    );
  }

  const progress = Math.min(
    (plan.currentAmount / plan.targetAmount) * 100,
    100,
  );
  // const isCompleted = plan.status === "COMPLETED";
  const isTargetDateReached = new Date() >= new Date(plan.targetDate);
  const canWithdraw = isTargetDateReached && plan.currentAmount > 0;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    depositMutation.mutate({ planId, amount: Number(depositAmount) });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {plan.title}
                  </h1>
                  <p className="text-gray-500">
                    {plan.description ?? "No description provided."}
                  </p>
                </div>
                <div
                  className={cn("rounded-full px-3 py-1 text-xs font-bold", {
                    "bg-green-100 text-green-700": plan.status === "ACTIVE",
                    "bg-blue-100 text-blue-700": plan.status === "COMPLETED",
                    "bg-red-100 text-red-700": plan.status === "CANCELLED",
                  })}
                >
                  {plan.status}
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-pink-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-pink-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Saved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{plan.currentAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-2xl font-bold text-gray-400">
                      ₦{plan.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <History className="h-5 w-5 text-gray-500" />
                History
              </h3>
              <div className="space-y-4">
                {plan.transactions.length > 0 ? (
                  plan.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {tx.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(tx.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-bold",
                          tx.amount > 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}₦
                        {Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    No transactions yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">Plan Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" /> Frequency
                  </span>
                  <span className="font-semibold capitalize">
                    {plan.frequency.toLowerCase()}
                  </span>
                </div>
                {plan.frequency !== "MANUAL" && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Target className="h-4 w-4" /> Auto-Save
                    </span>
                    <span className="font-semibold">
                      ₦{plan.autoSaveAmount?.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" /> Target Date
                  </span>
                  <span className="font-semibold">
                    {new Date(plan.targetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {plan.status === "ACTIVE" && (
                  <>
                    <Button
                      className="w-full bg-pink-600 hover:bg-pink-700"
                      onClick={() => setIsDepositModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Deposit Funds
                    </Button>

                    {canWithdraw ? (
                      <Button
                        variant="outline"
                        className="w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() =>
                          withdrawCompletedMutation.mutate({ planId })
                        }
                        disabled={withdrawCompletedMutation.isPending}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {withdrawCompletedMutation.isPending
                          ? "Withdrawing..."
                          : "Withdraw Funds"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => setIsBreakModalOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Break Plan
                      </Button>
                    )}

                    {!canWithdraw && (
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Funds are locked until{" "}
                        {new Date(plan.targetDate).toLocaleDateString()}.
                        Breaking the plan returns funds to your wallet.
                      </p>
                    )}
                  </>
                )}

                {plan.status === "COMPLETED" && (
                  <div className="rounded-md bg-green-50 p-3 text-center text-sm text-green-800">
                    This plan has been completed and funds withdrawn.
                  </div>
                )}
                {plan.status === "CANCELLED" && (
                  <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-800">
                    This plan was cancelled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to {plan.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeposit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="100"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={depositMutation.isPending}
                className="bg-pink-600"
              >
                {depositMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Deposit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Break Plan Confirmation Modal */}
      <Dialog open={isBreakModalOpen} onOpenChange={setIsBreakModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Break Savings Plan?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to break this plan?
              <br />
              <br />
              <strong>Action:</strong> The plan will be cancelled.
              <br />
              <strong>Refund:</strong> All saved funds (₦
              {plan.currentAmount.toLocaleString()}) will be immediately
              returned to your main wallet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBreakModalOpen(false)}
            >
              Keep Saving
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => breakPlanMutation.mutate({ planId })}
              disabled={breakPlanMutation.isPending}
            >
              {breakPlanMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Break Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanDetailsPage;
