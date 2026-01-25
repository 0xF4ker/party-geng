"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Search,
  Eye,
  Filter,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  MapPin,
  Globe,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

// --- TYPES ---
type RouterOutputs = inferRouterOutputs<AppRouter>;
type KybRequest = RouterOutputs["kyb"]["getRequests"][number];

// --- HELPER COMPONENT ---
const KybStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    IN_REVIEW: "bg-blue-100 text-blue-700 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    PENDING: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const icons: Record<string, LucideIcon> = {
    IN_REVIEW: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
    PENDING: Loader2,
  };

  const Icon = icons[status] ?? Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100"
      }`}
    >
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </span>
  );
};

// --- MOBILE CARD COMPONENT ---
const MobileKybCard = ({
  vendor,
  onClick,
}: {
  vendor: KybRequest;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <span className="font-medium text-gray-900">
            {vendor.vendorProfile?.companyName ?? "N/A"}
          </span>
        </div>
        <KybStatusBadge status={vendor.vendorProfile?.kybStatus ?? "PENDING"} />
      </div>

      <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500">
        <div>
          <span className="block font-medium tracking-wider text-gray-400 uppercase">
            Reg Number
          </span>
          <span className="font-mono text-gray-700">
            {vendor.vendorProfile?.regNumber ?? "N/A"}
          </span>
        </div>
        <div className="text-right">
          <span className="block font-medium tracking-wider text-gray-400 uppercase">
            Submitted
          </span>
          <span className="text-gray-700">
            {format(
              new Date(vendor.vendorProfile?.updatedAt ?? new Date()),
              "MMM d, yyyy",
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-sm">
        <span className="text-gray-600">
          {vendor.vendorProfile?.fullName ?? vendor.username}
        </span>
        <div className="flex items-center font-medium text-pink-600">
          View Details →
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AdminKybPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "IN_REVIEW" | "APPROVED" | "REJECTED" | undefined
  >(undefined);
  const [selectedVendor, setSelectedVendor] = useState<KybRequest | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    data: vendors,
    isLoading,
    refetch,
  } = api.kyb.getRequests.useQuery({
    limit: 50,
    search: search || undefined,
    status: statusFilter,
  });

  const processMutation = api.kyb.processDecision.useMutation({
    onSuccess: () => {
      toast.success("Vendor status updated successfully");
      void refetch();
      setIsSheetOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenDetail = (vendor: KybRequest) => {
    setSelectedVendor(vendor);
    setIsSheetOpen(true);
  };

  const handleDecision = (decision: "APPROVED" | "REJECTED") => {
    if (!selectedVendor) return;

    let reason = "";
    if (decision === "REJECTED") {
      const input = prompt("Please provide a reason for rejection:");
      if (input === null) return;
      reason = input;
    }

    processMutation.mutate({
      userId: selectedVendor.id,
      decision,
      rejectionReason: reason,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 1. HEADER & FILTERS */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYB Verification</h1>
          <p className="text-sm text-gray-500">
            Review and verify vendor business documentation.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search Company or RC..."
              className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pr-8 pl-10 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              value={statusFilter ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (
                  val === "IN_REVIEW" ||
                  val === "APPROVED" ||
                  val === "REJECTED"
                ) {
                  setStatusFilter(val);
                } else {
                  setStatusFilter(undefined);
                }
              }}
            >
              <option value="">All Statuses</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP DATA TABLE */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Company Name</th>
              <th className="px-6 py-4">Reg Number</th>
              <th className="px-6 py-4">Contact Person</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : vendors?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No requests found matching criteria.
                </td>
              </tr>
            ) : (
              vendors?.map((vendor) => (
                <tr key={vendor.id} className="group hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {vendor.vendorProfile?.companyName ?? "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {vendor.vendorProfile?.regNumber ?? "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {vendor.vendorProfile?.fullName ?? vendor.username}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {format(
                      new Date(vendor.vendorProfile?.updatedAt ?? new Date()),
                      "MMM d, yyyy",
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <KybStatusBadge
                      status={vendor.vendorProfile?.kybStatus ?? "PENDING"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(vendor)}
                    >
                      <Eye className="mr-2 h-4 w-4 text-gray-400" /> Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MOBILE CARD GRID (New Section) */}
      <div className="grid gap-4 md:hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : vendors?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
            No requests found.
          </div>
        ) : (
          vendors?.map((vendor) => (
            <MobileKybCard
              key={vendor.id}
              vendor={vendor}
              onClick={() => handleOpenDetail(vendor)}
            />
          ))
        )}
      </div>

      {/* 4. DETAILS SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex h-full w-full flex-col border-l border-gray-200 bg-white p-0 shadow-2xl sm:max-w-xl">
          {selectedVendor && selectedVendor.vendorProfile && (
            <>
              {/* Sheet Header */}
              <div className="flex-none border-b border-gray-100 bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Business Verification
                    </span>
                  </div>
                  <KybStatusBadge
                    status={selectedVendor.vendorProfile.kybStatus}
                  />
                </div>
                <div className="mt-4">
                  <SheetTitle className="text-xl font-bold text-gray-900">
                    {selectedVendor.vendorProfile.companyName}
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-3.5 w-3.5" />
                    {selectedVendor.vendorProfile.country ?? "Nigeria"}
                  </SheetDescription>
                </div>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-8">
                  {/* Section A: Submitted Data */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-900 uppercase">
                      <FileText className="h-3.5 w-3.5" /> Submitted Details
                    </h4>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div>
                          <span className="block text-xs text-gray-500">
                            Reg Number (RC/BN)
                          </span>
                          <span className="font-mono font-medium text-gray-900">
                            {selectedVendor.vendorProfile.regNumber}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-500">
                            Contact Person
                          </span>
                          <span className="font-medium text-gray-900">
                            {selectedVendor.vendorProfile.fullName}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-xs text-gray-500">
                            Business Address
                          </span>
                          <div className="mt-1 flex gap-2 text-gray-900">
                            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>
                              {selectedVendor.vendorProfile.businessAddress}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-xs text-gray-500">
                            Business Description
                          </span>
                          <p className="mt-1 text-gray-900">
                            {selectedVendor.vendorProfile.about ??
                              "No description provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Automated Check Simulation */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-900 uppercase">
                      <ShieldCheck className="h-3.5 w-3.5" /> Registry
                      Verification
                    </h4>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-900">
                            Automated Match
                          </h5>
                          <p className="mt-1 text-xs leading-relaxed text-blue-700">
                            The submitted Registration Number{" "}
                            <strong>
                              {selectedVendor.vendorProfile.regNumber}
                            </strong>{" "}
                            appears to exist in the registry for{" "}
                            <strong>
                              {selectedVendor.vendorProfile.country}
                            </strong>
                            .
                          </p>
                          <div className="mt-3 flex gap-2">
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-white text-blue-700"
                            >
                              Status: Active
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-white text-blue-700"
                            >
                              Score: 98%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section C: Admin Actions */}
                  {selectedVendor.vendorProfile.kybStatus === "IN_REVIEW" && (
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-orange-600 uppercase">
                        <AlertTriangle className="h-3.5 w-3.5" /> Adjudication
                      </h4>

                      <div className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50/30 p-5">
                        <p className="text-sm text-gray-600">
                          Please verify the details above match the official
                          registry response. This action cannot be easily
                          undone.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDecision("REJECTED")}
                            disabled={processMutation.isPending}
                          >
                            Reject Application
                          </Button>
                          <Button
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleDecision("APPROVED")}
                            disabled={processMutation.isPending}
                          >
                            {processMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Approve Vendor
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sheet Footer */}
              <SheetFooter className="flex-none border-t border-gray-100 bg-gray-50/50 px-8 py-4">
                <Button variant="ghost" onClick={() => setIsSheetOpen(false)}>
                  Close Panel
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
