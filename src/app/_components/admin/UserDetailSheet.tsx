"use client";

import { api } from "@/trpc/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Store,
  ShieldAlert,
  Wallet,
  ShoppingBag,
  Star,
  MapPin,
  Mail,
  Loader2,
  Clock,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
    BANNED: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

// New helper to safely render Nominatim JSON location
const LocationDisplay = ({ location }: { location: unknown }) => {
  if (!location) return <span className="text-gray-400 italic">Not set</span>;

  let displayName = "Unknown Location";

  if (
    typeof location === "object" &&
    location !== null &&
    "display_name" in location
  ) {
    // Nominatim format
    displayName = (location as { display_name: string }).display_name;
  } else if (typeof location === "string") {
    // Legacy string format
    displayName = location;
  }

  return <span>{displayName}</span>;
};

interface UserDetailSheetProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailSheet({
  userId,
  isOpen,
  onClose,
}: UserDetailSheetProps) {
  // Only fetch if we have an ID and the sheet is open
  const { data: user, isLoading } = api.user.adminGetUser.useQuery(
    { userId: userId! },
    { enabled: !!userId && isOpen },
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto bg-white p-0 sm:max-w-xl">
        {isLoading || !user ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* 1. HEADER HERO */}
            <div className="relative border-b border-gray-100 bg-gray-50/80 p-8 pb-10">
              <div className="mb-6 flex items-start justify-between">
                <StatusBadge status={user.status} />
                <Badge variant="outline" className="font-mono text-gray-500">
                  {user.role}
                </Badge>
              </div>

              <div className="flex items-center gap-5">
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
                  {user.clientProfile?.avatarUrl ||
                  user.vendorProfile?.avatarUrl ? (
                    <img
                      src={
                        user.clientProfile?.avatarUrl ??
                        user.vendorProfile?.avatarUrl ??
                        ""
                      }
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.clientProfile?.name ??
                      user.vendorProfile?.companyName ??
                      user.username}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-2 gap-px border-b border-gray-100 bg-gray-100">
              {/* Wallet (Common) */}
              <div className="bg-white p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                  <Wallet className="h-4 w-4 text-emerald-600" /> Wallet Balance
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {user.wallet
                    ? formatCurrency(user.wallet.availableBalance)
                    : "—"}
                </div>
              </div>

              {/* Role Specific Stat */}
              <div className="bg-white p-5">
                {user.role === "CLIENT" && (
                  <>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <ShoppingBag className="h-4 w-4 text-blue-600" /> Orders
                      Placed
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {user._count.clientOrders}
                    </div>
                  </>
                )}
                {user.role === "VENDOR" && (
                  <>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <Star className="h-4 w-4 text-yellow-500" /> Rating
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {user.vendorProfile?.rating.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-gray-400">
                        / 5.0
                      </span>
                    </div>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <ShieldAlert className="h-4 w-4 text-purple-600" />{" "}
                      Department
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {user.adminProfile?.department ?? "General"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. DETAILS SECTION */}
            <div className="flex-1 space-y-8 p-8">
              {/* Vendor Specific Details */}
              {user.role === "VENDOR" && user.vendorProfile && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Store className="h-4 w-4 text-gray-400" /> Vendor Profile
                  </h3>
                  <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    {/* KYB Status */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ShieldCheck className="h-3.5 w-3.5" /> KYB Status
                      </div>
                      <Badge
                        variant={
                          user.vendorProfile.kybStatus === "APPROVED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.vendorProfile.kybStatus}
                      </Badge>
                    </div>

                    {/* Subscription Status (NEW) */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CreditCard className="h-3.5 w-3.5" /> Subscription
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          user.vendorProfile.subscriptionStatus === "ACTIVE"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-100 text-gray-600"
                        }
                      >
                        {user.vendorProfile.subscriptionStatus || "INACTIVE"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="text-sm text-gray-500">
                        Active Services
                      </span>
                      <span className="text-sm font-medium">
                        {user.vendorProfile._count.services}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Level</span>
                      <span className="text-sm font-medium">
                        {user.vendorProfile.level}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Specific Details */}
              {user.role === "CLIENT" && user.clientProfile && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <User className="h-4 w-4 text-gray-400" /> Client Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {user.clientProfile._count.events}
                      </div>
                      <div className="text-xs text-gray-500">
                        Events Created
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {user._count.authoredReviews}
                      </div>
                      <div className="text-xs text-gray-500">
                        Reviews Written
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio & Location (Common) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">About</h3>
                <div className="text-sm leading-relaxed text-gray-600">
                  {user.clientProfile?.bio || user.vendorProfile?.about ? (
                    (user.clientProfile?.bio ?? user.vendorProfile?.about)
                  ) : (
                    <span className="text-gray-400 italic">
                      No biography provided.
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <LocationDisplay
                    location={
                      user.clientProfile?.location ??
                      user.vendorProfile?.location
                    }
                  />
                </div>
              </div>
            </div>

            {/* 4. FOOTER ACTIONS */}
            <div className="border-t border-gray-100 bg-gray-50 p-6">
              <Button className="w-full" variant="outline" onClick={onClose}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
