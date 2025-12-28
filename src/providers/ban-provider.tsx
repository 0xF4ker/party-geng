"use client";

import React from "react";
import { useAuthStore } from "@/stores/auth"; // Or your specific auth hook path
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, Mail, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const BanProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().setProfile(null); // Clear store
    router.push("/");
    router.refresh();
  };

  // 1. Allow loading state to pass or handle gracefully
  if (isLoading) {
    return <>{children}</>;
  }

  // 2. If not logged in, just render children (Middleware handles protection)
  if (!profile) {
    return <>{children}</>;
  }

  // 3. Check Status
  const isBanned = profile.status === "BANNED";
  const isSuspended = profile.status === "SUSPENDED";

  // 4. If Active, render app normally
  if (!isBanned && !isSuspended) {
    return <>{children}</>;
  }

  // 5. Render "Lock Screen"
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div
            className={`rounded-full p-4 ${isBanned ? "bg-red-100" : "bg-orange-100"}`}
          >
            {isBanned ? (
              <ShieldAlert
                className={`h-12 w-12 ${isBanned ? "text-red-600" : "text-orange-600"}`}
              />
            ) : (
              <Clock className="h-12 w-12 text-orange-600" />
            )}
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {isBanned ? "Account Banned" : "Account Suspended"}
        </h1>

        <p className="mb-6 text-gray-600">
          {isBanned
            ? "Your account has been permanently disabled due to a violation of our terms of service."
            : "Your account has been temporarily suspended."}
        </p>

        {profile.suspensionReason && (
          <div className="mb-8 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left">
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Reason Provided
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {profile.suspensionReason}
            </p>
            {isSuspended && profile.suspendedUntil && (
              <p className="mt-2 text-xs text-gray-500">
                Suspension lifts on:{" "}
                <span className="font-medium">
                  {new Date(profile.suspendedUntil).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            className="w-full gap-2 bg-black hover:bg-gray-800"
            onClick={() =>
              (window.location.href =
                "mailto:support@partygeng.com?subject=Appeal%20Suspension")
            }
          >
            <Mail className="h-4 w-4" />
            Contact Support to Appeal
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-400">User ID: {profile.id}</div>
    </div>
  );
};
