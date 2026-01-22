"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth";
import { VendorOnboarding } from "@/app/_components/auth/VendorOnboarding";
import { Clock, ShieldAlert, LogOut } from "lucide-react"; // Import LogOut
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const KybProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, isLoading, setProfile } = useAuthStore();
  const queryClient = useQueryClient();

  // --- Shared Sign Out Logic ---
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      // Clear stores and cache immediately
      setProfile(null);
      queryClient.clear();

      // Force hard redirect
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error", error);
      window.location.href = "/";
    }
  };

  if (isLoading) return null;

  if (!profile || profile.role !== "VENDOR") {
    return <>{children}</>;
  }

  const status = profile.vendorProfile?.kybStatus ?? "PENDING";

  if (status === "APPROVED") {
    return <>{children}</>;
  }

  // --- PENDING: Show Wizard (Pass logout handler) ---
  if (status === "PENDING") {
    // We pass the handler so the component doesn't need to reimplement it
    return <VendorOnboarding onSignOut={handleSignOut} />;
  }

  // --- IN_REVIEW: Show Status Screen + Logout ---
  if (status === "IN_REVIEW") {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-50 p-4">
              <Clock className="h-12 w-12 animate-pulse text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Verification in Progress
          </h1>
          <p className="mt-2 text-gray-500">
            We are currently verifying your business details with the registry.
            This typically takes less than 24 hours.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              className="w-full bg-black hover:bg-gray-800"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2 text-gray-600"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- REJECTED: Show Error + Wizard (Pass logout handler) ---
  if (status === "REJECTED") {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-red-600 p-3 text-sm font-medium text-white shadow-md">
          <ShieldAlert className="h-4 w-4" />
          <span>
            Verification Rejected. Please check your details and try again.
          </span>
        </div>
        <VendorOnboarding onSignOut={handleSignOut} />
      </div>
    );
  }

  return null;
};
