"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth";
import { ShieldCheck, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export const SubscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { profile, isLoading, setProfile } = useAuthStore();
  const utils = api.useUtils();

  const initPayment = api.payment.initializeSubscription.useMutation({
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyPayment = api.payment.verifySubscription.useMutation({
    onSuccess: async () => {
      toast.success("Subscription active! Welcome aboard.");
      // Refresh profile to update local store state
      await utils.user.getProfile.invalidate();
      // Optimistic update if needed, but invalidate should handle it
      if (profile && profile.vendorProfile) {
        setProfile({
          ...profile,
          vendorProfile: {
            ...profile.vendorProfile,
            subscriptionStatus: "ACTIVE",
          },
        });
      }
    },
  });

  // Check for reference in URL (callback handling)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get("reference");
      if (
        reference &&
        profile?.vendorProfile?.subscriptionStatus !== "ACTIVE"
      ) {
        // Clear param to prevent loop
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        verifyPayment.mutate({ reference });
      }
    }
  }, [profile, verifyPayment]);

  if (isLoading) return null;

  // Pass through if not a Vendor or if KYB is not Approved yet (KybProvider handles that)
  if (
    !profile ||
    profile.role !== "VENDOR" ||
    profile.vendorProfile?.kybStatus !== "APPROVED"
  ) {
    return <>{children}</>;
  }

  // Check Subscription
  if (profile.vendorProfile?.subscriptionStatus === "ACTIVE") {
    return <>{children}</>;
  }

  // --- RENDER PAYMENT GATE ---
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-pink-50 p-4">
            <ShieldCheck className="h-12 w-12 text-pink-600" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Account Verified!
        </h1>
        <p className="mb-6 text-gray-600">
          Congratulations on passing verification. To activate your vendor
          account and start receiving orders, a one-time activation fee is
          required.
        </p>

        <div className="mb-8 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Activation Fee
            </span>
            <span className="text-xl font-bold text-gray-900">
              {/* You could fetch the actual amount via query, but loading UI is simpler */}
              One-time Payment
            </span>
          </div>
        </div>

        <Button
          className="w-full gap-2 bg-pink-600 hover:bg-pink-700"
          onClick={() => initPayment.mutate()}
          disabled={initPayment.isPending || verifyPayment.isPending}
        >
          {initPayment.isPending || verifyPayment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Pay & Activate Now
        </Button>
      </div>
    </div>
  );
};
