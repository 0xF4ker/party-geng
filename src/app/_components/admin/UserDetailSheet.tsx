"use client";

import { api } from "@/trpc/react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Store, 
  ShieldAlert, 
  Wallet, 
  Calendar, 
  ShoppingBag, 
  Star, 
  FileCheck,
  MapPin,
  Mail,
  Loader2,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface UserDetailSheetProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailSheet({ userId, isOpen, onClose }: UserDetailSheetProps) {
  // Only fetch if we have an ID and the sheet is open
  const { data: user, isLoading } = api.user.adminGetUser.useQuery(
    { userId: userId! },
    { enabled: !!userId && isOpen }
  );

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  // Status Badge Helper
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
      BANNED: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto bg-white">
        {isLoading || !user ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            
            {/* 1. HEADER HERO */}
            <div className="relative bg-gray-50/80 p-8 pb-10 border-b border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <StatusBadge status={user.status} />
                <Badge variant="outline" className="font-mono text-gray-500">
                  {user.role}
                </Badge>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
                  {user.clientProfile?.avatarUrl || user.vendorProfile?.avatarUrl ? (
                    <img 
                      src={user.clientProfile?.avatarUrl || user.vendorProfile?.avatarUrl || ""} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.clientProfile?.name || user.vendorProfile?.companyName || user.username}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
              {/* Wallet (Common) */}
              <div className="bg-white p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  <Wallet className="h-4 w-4 text-emerald-600" /> Wallet Balance
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {user.wallet ? formatCurrency(user.wallet.availableBalance) : "—"}
                </div>
              </div>

              {/* Role Specific Stat */}
              <div className="bg-white p-5">
                {user.role === "CLIENT" && (
                  <>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      <ShoppingBag className="h-4 w-4 text-blue-600" /> Orders Placed
                    </div>
                    <div className="text-xl font-bold text-gray-900">{user._count.clientOrders}</div>
                  </>
                )}
                {user.role === "VENDOR" && (
                  <>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      <Star className="h-4 w-4 text-yellow-500" /> Rating
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {user.vendorProfile?.rating.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5.0</span>
                    </div>
                  </>
                )}
                 {user.role === "ADMIN" && (
                  <>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      <ShieldAlert className="h-4 w-4 text-purple-600" /> Department
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {user.adminProfile?.department || "General"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. DETAILS SECTION */}
            <div className="p-8 space-y-8 flex-1">
              
              {/* Vendor Specific Details */}
              {user.role === "VENDOR" && user.vendorProfile && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-400" /> Vendor Profile
                  </h3>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-sm text-gray-500">KYC Status</span>
                      <Badge variant={user.vendorProfile.kycStatus === 'APPROVED' ? 'default' : 'secondary'}>
                        {user.vendorProfile.kycStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-sm text-gray-500">Active Services</span>
                      <span className="text-sm font-medium">{user.vendorProfile._count.services}</span>
                    </div>
                     <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Level</span>
                      <span className="text-sm font-medium">{user.vendorProfile.level}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Specific Details */}
              {user.role === "CLIENT" && user.clientProfile && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" /> Client Stats
                  </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-100 p-3 text-center">
                         <div className="text-2xl font-bold text-gray-900">{user.clientProfile._count.events}</div>
                         <div className="text-xs text-gray-500">Events Created</div>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3 text-center">
                         <div className="text-2xl font-bold text-gray-900">{user._count.authoredReviews}</div>
                         <div className="text-xs text-gray-500">Reviews Written</div>
                      </div>
                   </div>
                </div>
              )}

              {/* Bio & Location (Common) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">About</h3>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {(user.clientProfile?.bio || user.vendorProfile?.about) ? (
                    user.clientProfile?.bio || user.vendorProfile?.about
                  ) : (
                    <span className="italic text-gray-400">No biography provided.</span>
                  )}
                </div>
                
                {(user.clientProfile?.location || user.vendorProfile?.location) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
                    <MapPin className="h-4 w-4" />
                    {/* Assuming location is stored as JSON { city: string, state: string } or similar string */}
                    <span>
                      {JSON.stringify(user.clientProfile?.location || user.vendorProfile?.location).replace(/["{}]/g, '').replace(/:/g, ': ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. FOOTER ACTIONS */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
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
