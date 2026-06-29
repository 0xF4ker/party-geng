"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, User, Award, ShieldAlert, Wallet, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HireCoordinatorModalProps {
  event: {
    id: string;
    title: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function HireCoordinatorModal({
  event,
  isOpen,
  onClose,
}: HireCoordinatorModalProps) {
  const utils = api.useUtils();

  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
  const [insufficientFundsFor, setInsufficientFundsFor] = useState<{
    name: string;
    price: number;
    balance: number;
  } | null>(null);
  const [loadingTopUp, setLoadingTopUp] = useState(false);

  // Queries
  const { data: coordinators, isLoading: loadingCoordinators } =
    api.coordinator.listAvailable.useQuery(undefined, { enabled: isOpen });

  const { data: wallet, isLoading: loadingWallet } =
    api.payment.getWallet.useQuery(undefined, { enabled: isOpen });

  // Mutations
  const hireCoordinatorMutation = api.event.hireCoordinator.useMutation({
    onSuccess: () => {
      toast.success("Coordinator successfully hired and added to event!");
      void utils.event.getById.invalidate({ id: event.id });
      onClose();
    },
    onError: (err) => {
      if (err.message.includes("INSUFFICIENT_FUNDS")) {
        const coord = coordinators?.find((c) => c.id === selectedCoordinatorId);
        if (coord && wallet) {
          setInsufficientFundsFor({
            name: coord.name ?? `@${coord.user.username}`,
            price: coord.price,
            balance: wallet.availableBalance,
          });
        } else {
          toast.error("Insufficient wallet balance to hire this coordinator.");
        }
      } else {
        toast.error(err.message || "Failed to hire coordinator.");
      }
    },
  });

  const initializePaymentMutation = api.payment.initializePayment.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to Paystack...");
      window.location.href = data.authorization_url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initialize payment.");
      setLoadingTopUp(false);
    },
  });

  const handleHire = (coordinatorId: string) => {
    setSelectedCoordinatorId(coordinatorId);
    setInsufficientFundsFor(null);
    hireCoordinatorMutation.mutate({
      eventId: event.id,
      coordinatorId,
    });
  };

  const handleTopUp = () => {
    if (!insufficientFundsFor || !wallet) return;
    setLoadingTopUp(true);
    const missingAmount = insufficientFundsFor.price - insufficientFundsFor.balance;
    // Initialize payment for the missing amount
    initializePaymentMutation.mutate({
      amount: missingAmount,
      email: coordinators?.find((c) => c.id === selectedCoordinatorId)?.user.email ?? "billing@partygeng.com",
      metadata: {
        type: "wallet_topup",
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Hire an Event Coordinator</DialogTitle>
          <DialogDescription>
            Choose a dedicated coordinator to collaborate on the board for <strong>{event.title}</strong>.
          </DialogDescription>
        </DialogHeader>

        {insufficientFundsFor ? (
          /* Insufficient Funds Guide */
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-rose-100 p-3 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-rose-900">Insufficient Wallet Balance</h3>
                <p className="text-sm text-rose-700 leading-relaxed">
                  You are hiring <strong>{insufficientFundsFor.name}</strong> for{" "}
                  <strong className="text-rose-900">₦{insufficientFundsFor.price.toLocaleString()}</strong>, but
                  your current balance is only{" "}
                  <strong className="text-rose-900">₦{insufficientFundsFor.balance.toLocaleString()}</strong>.
                </p>
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  We will walk you through funding your wallet with the remaining{" "}
                  <strong>₦{(insufficientFundsFor.price - insufficientFundsFor.balance).toLocaleString()}</strong> via
                  Paystack. Once funded, you can return here to hire them.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-rose-200 pt-4">
              <Button
                variant="ghost"
                onClick={() => setInsufficientFundsFor(null)}
                disabled={loadingTopUp}
                className="text-rose-800 hover:bg-rose-100"
              >
                Go Back
              </Button>
              <Button
                onClick={handleTopUp}
                disabled={loadingTopUp}
                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
              >
                {loadingTopUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing Paystack...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Top Up ₦{(insufficientFundsFor.price - insufficientFundsFor.balance).toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : loadingCoordinators || loadingWallet ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : coordinators && coordinators.length > 0 ? (
          <div className="space-y-4 py-4">
            {/* Display client's wallet balance */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Your Wallet Balance</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                ₦{wallet?.availableBalance.toLocaleString() ?? "0"}
              </span>
            </div>

            {/* Coordinator List */}
            <div className="grid grid-cols-1 gap-4">
              {coordinators.map((c) => {
                const isHiringThis = hireCoordinatorMutation.isPending && selectedCoordinatorId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-pink-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-pink-50 border border-pink-100 shrink-0 flex items-center justify-center text-pink-600 font-bold text-lg">
                        {c.avatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={c.avatarUrl} alt={c.name ?? "avatar"} className="h-full w-full object-cover" />
                        ) : (
                          (c.name ?? c.user.username).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-900">{c.name ?? c.user.username}</h4>
                          <Award className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-xs text-pink-600 font-semibold">@{c.user.username}</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{c.bio}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium md:text-right">Flat Hiring Rate</p>
                        <p className="text-lg font-black text-slate-900">₦{c.price.toLocaleString()}</p>
                      </div>
                      <Button
                        onClick={() => handleHire(c.id)}
                        disabled={hireCoordinatorMutation.isPending}
                        className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl"
                        size="sm"
                      >
                        {isHiringThis ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Hiring...
                          </>
                        ) : (
                          "Hire Coordinator"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-lg">No coordinators available</p>
            <p className="text-sm">There are currently no coordinators registered on the platform.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
