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
  Play,
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
type RegistryData = NonNullable<RouterOutputs["kyb"]["verifyRegistry"]>;

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

  // Verification State
  const [registryData, setRegistryData] = useState<RegistryData | null>(null);

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
      handleCloseSheet();
    },
    onError: (e) => toast.error(e.message),
  });

  // New Verification Mutation
  const verifyMutation = api.kyb.verifyRegistry.useMutation({
    onSuccess: (data) => {
      setRegistryData(data ?? null);
      toast.success("Registry fetch successful!");
    },
    onError: (e) => {
      toast.error(e.message || "Failed to fetch from registry.");
    },
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

  const handleRunVerification = () => {
    if (selectedVendor) {
      verifyMutation.mutate({ userId: selectedVendor.id });
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);

    setTimeout(() => {
      setRegistryData(null);
      verifyMutation.reset();
      // setSelectedVendor(null);
    }, 300);
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

      {/* 3. MOBILE CARD GRID */}
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
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseSheet();
          } else {
            setIsSheetOpen(true);
          }
        }}
      >
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
                    <Globe className="h-3.5 w-3.5" />{" "}
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
                      </div>
                    </div>
                  </div>

                  {/* Section B: Manual Check Execution */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-900 uppercase">
                      <ShieldCheck className="h-3.5 w-3.5" /> Live Registry
                      Check
                    </h4>

                    {!registryData &&
                      !verifyMutation.isPending &&
                      !verifyMutation.isError && (
                        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-6 text-center">
                          <p className="mb-4 text-sm text-blue-800">
                            Run a live verification check against the corporate
                            registry to confirm this business exists.
                          </p>
                          <Button
                            onClick={handleRunVerification}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Run Verification
                          </Button>
                        </div>
                      )}

                    {verifyMutation.isPending && (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-8">
                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">
                          Querying registry database...
                        </p>
                      </div>
                    )}

                    {verifyMutation.isError && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                        <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
                        <p className="mb-1 text-sm font-medium text-red-800">
                          Verification Request Failed
                        </p>
                        <p className="mb-4 text-xs text-red-600">
                          {verifyMutation.error.message}
                        </p>
                        <Button
                          onClick={handleRunVerification}
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-100"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}

                    {registryData && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="w-full">
                            <h5 className="flex items-center justify-between font-semibold text-emerald-900">
                              Registry Match Found
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-white text-emerald-700"
                              >
                                Verified
                              </Badge>
                            </h5>

                            <div className="mt-4 grid grid-cols-1 gap-y-3 border-t border-emerald-100 pt-3 text-sm">
                              <div>
                                <span className="block text-xs font-medium text-emerald-700/70">
                                  Entity Name
                                </span>
                                <span className="font-medium text-emerald-900">
                                  {registryData.entity_name}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="block text-xs font-medium text-emerald-700/70">
                                    Entity Type
                                  </span>
                                  <span className="text-emerald-900">
                                    {registryData.entity_type}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-xs font-medium text-emerald-700/70">
                                    RC Number
                                  </span>
                                  <span className="font-mono text-emerald-900">
                                    {registryData.rc_number}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="block text-xs font-medium text-emerald-700/70">
                                  Registration Date
                                </span>
                                <span className="text-emerald-900">
                                  {registryData.registration_date}
                                </span>
                              </div>
                              {registryData.objectives &&
                                registryData.objectives.length > 0 && (
                                  <div>
                                    <span className="mb-1 block text-xs font-medium text-emerald-700/70">
                                      Objectives
                                    </span>
                                    <ul className="list-disc space-y-1 pl-4 text-xs text-emerald-800">
                                      {registryData.objectives.map((obj, i) => (
                                        <li key={i}>{obj}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section C: Admin Actions */}
                  {selectedVendor.vendorProfile.kybStatus === "IN_REVIEW" && (
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-orange-600 uppercase">
                        <AlertTriangle className="h-3.5 w-3.5" /> Adjudication
                      </h4>

                      <div className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50/30 p-5">
                        <p className="text-sm text-gray-600">
                          Please ensure the submitted details match the official
                          registry response before approving.
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
                {/* Update the onClick handler */}
                <Button variant="ghost" onClick={handleCloseSheet}>
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
