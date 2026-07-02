"use client";

import React, { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import {
  Briefcase,
  Search,
  Loader2,
  Ban,
  Undo2,
  Eye,
  Activity,
  CreditCard,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminCoordinatorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Selected states for modallings
  const [selectedCoord, setSelectedCoord] = useState<any | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);

  // Suspension inputs
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDays, setSuspendDays] = useState<number>(7);

  // Queries & Mutations
  const { data, isLoading, refetch } = api.admin.listCoordinators.useQuery({
    limit,
    offset,
    search: search || undefined,
  });

  const toggleListing = api.admin.toggleCoordinatorListing.useMutation({
    onSuccess: () => {
      toast.success("Availability setting updated");
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update listing setting");
    },
  });

  const suspendMutation = api.user.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("Coordinator profile suspended");
      setIsSuspendOpen(false);
      setSuspendReason("");
      setSelectedCoord(null);
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to suspend account");
    },
  });

  const restoreMutation = api.user.restoreUser.useMutation({
    onSuccess: () => {
      toast.success("Coordinator access restored");
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to restore account");
    },
  });

  const handleToggleListing = (profileId: string, currentVal: boolean) => {
    toggleListing.mutate({ profileId, isAvailable: !currentVal });
  };

  const handleSuspendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord) return;
    if (!suspendReason.trim()) {
      toast.error("Please enter a reason for suspension");
      return;
    }
    suspendMutation.mutate({
      userId: selectedCoord.user.id,
      reason: suspendReason,
      durationDays: suspendDays,
    });
  };

  const handleRestore = (userId: string) => {
    restoreMutation.mutate({ userId });
  };

  // Stats Calculations based on returned profiles
  const totalCoordinators = data?.total ?? 0;
  const stats = useMemo(() => {
    if (!data?.items) return { activeContracts: 0, completedContracts: 0, totalVolume: 0 };
    let active = 0;
    let completed = 0;
    let volume = 0;

    data.items.forEach((c) => {
      c.events.forEach((evt) => {
        const isPast = new Date(evt.endDate) < new Date();
        if (isPast) {
          completed++;
        } else {
          active++;
        }
        volume += c.price;
      });
    });

    return { activeContracts: active, completedContracts: completed, totalVolume: volume };
  }, [data?.items]);

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Coordinator Workspace</h1>
          <p className="text-sm text-gray-500">Monitor coordinator activities, override availability, and audit financial transactions.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Coordinators */}
        <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Coordinators</h3>
            <div className="rounded-full bg-pink-50 p-2 text-pink-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : totalCoordinators}</p>
            <p className="mt-1 text-xs text-gray-500">Registered platform coordinators</p>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Active Contracts</h3>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : stats.activeContracts}</p>
            <p className="mt-1 text-xs text-gray-500">Current running collaborations</p>
          </div>
        </div>

        {/* Completed Contracts */}
        <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Completed Contracts</h3>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{isLoading ? "..." : stats.completedContracts}</p>
            <p className="mt-1 text-xs text-gray-500">Successfully ended whiteboards</p>
          </div>
        </div>

        {/* Total Volume */}
        <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Coordinator Volume</h3>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {isLoading
                ? "..."
                : new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    maximumFractionDigits: 0,
                  }).format(stats.totalVolume)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Cumulative coordination fees</p>
          </div>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name, username, or email..."
              className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-sm focus:border-pink-500 focus:outline-none"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex h-60 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-600 border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4">Coordinator</th>
                  <th className="px-6 py-4 text-right">Flat Rate</th>
                  <th className="px-6 py-4 text-center">Active / Total Gigs</th>
                  <th className="px-6 py-4 text-right">Wallet Balance</th>
                  <th className="px-6 py-4 text-center">Listed Availability</th>
                  <th className="px-6 py-4 text-center">User Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((coord) => {
                  const activeCount = coord.events.filter(
                    (evt) => new Date(evt.endDate) >= new Date()
                  ).length;
                  const isSuspended =
                    coord.user.status === "SUSPENDED" || coord.user.status === "BANNED";

                  return (
                    <tr key={coord.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-150">
                            {coord.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coord.avatarUrl}
                                alt={coord.name ?? ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                                {coord.name ? coord.name[0]?.toUpperCase() : "?"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{coord.name || "Unnamed"}</p>
                            <p className="text-xs text-gray-400">
                              @{coord.user.username} · {coord.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₦{coord.price.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-center text-xs font-medium">
                        <span className="text-blue-600">{activeCount} active</span>
                        <span className="text-gray-400"> / {coord.events.length} total</span>
                      </td>

                      <td className="px-6 py-4 text-right font-medium">
                        <p className="text-gray-900">
                          ₦{(coord.user.wallet?.availableBalance ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Total Earned: ₦{(coord.user.wallet?.totalEarnings ?? 0).toLocaleString()}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleListing(coord.id, coord.isAvailable)}
                          disabled={toggleListing.isPending}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-all shadow-xs ${
                            coord.isAvailable
                              ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-150"
                          }`}
                        >
                          {coord.isAvailable ? "✓ Listed" : "✕ Unlisted"}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            coord.user.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              coord.user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {coord.user.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCoord(coord);
                              setIsActivityOpen(true);
                            }}
                            title="Monitor Activity"
                          >
                            <Eye className="h-4 w-4 text-gray-400 hover:text-pink-600 transition" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Audits & Ban</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {isSuspended ? (
                                <DropdownMenuItem onClick={() => handleRestore(coord.user.id)}>
                                  <Undo2 className="mr-2 h-4 w-4 text-emerald-600" /> Restore Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCoord(coord);
                                    setIsSuspendOpen(true);
                                  }}
                                  className="text-orange-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" /> Suspend Coordinator
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                <p className="text-xs text-gray-500">
                  Showing page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-bold text-gray-900">No coordinators found</h3>
            <p className="mt-1 text-sm text-gray-500">Try modifying your search filter parameters.</p>
          </div>
        )}
      </div>

      {/* DRAWER: ACTIVITY MONITOR & FINANCIAL LEDGER */}
      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="w-full overflow-y-auto bg-white p-0 sm:max-w-2xl border-l border-gray-100 shadow-2xl">
          {selectedCoord && (
            <div className="flex h-full flex-col text-gray-900">
              {/* Drawer Header Banner */}
              <div className="bg-slate-900 text-white p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 shrink-0">
                    {selectedCoord.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedCoord.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-white text-lg bg-pink-600">
                        {selectedCoord.name ? selectedCoord.name[0]?.toUpperCase() : "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{selectedCoord.name || "Unnamed"}</h2>
                    <p className="text-xs text-slate-300">
                      @{selectedCoord.user.username} · {selectedCoord.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Main Content Container */}
              <div className="p-6 space-y-6 flex-grow">
                {/* Event Contracts Grid */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-pink-500" />
                    Coordination Contracts ({selectedCoord.events.length})
                  </h3>

                  {selectedCoord.events.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase sticky top-0 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3">Event Title</th>
                            <th className="px-4 py-3">Client (Host)</th>
                            <th className="px-4 py-3">Timeline Date</th>
                            <th className="px-4 py-3 text-right">Hire Fee</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {selectedCoord.events.map((evt: any) => {
                            const isPast = new Date(evt.endDate) < new Date();
                            return (
                              <tr key={evt.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-semibold text-gray-900">{evt.title}</td>
                                <td className="px-4 py-3 text-gray-500">
                                  {evt.client.name ?? `@${evt.client.user.username}`}
                                </td>
                                <td className="px-4 py-3 text-gray-400">
                                  {new Date(evt.startDate).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                  ₦{selectedCoord.price.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${
                                    isPast
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {isPast ? "Past" : "Active"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-150 bg-gray-50 p-6 text-center text-xs text-gray-400">
                      No coordination contracts logged.
                    </div>
                  )}
                </div>

                {/* Financial Ledger (Transactions) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-pink-500" />
                    Financial Ledger / Transactions
                  </h3>

                  {selectedCoord.user.wallet?.transactions &&
                  selectedCoord.user.wallet.transactions.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm max-h-[30rem]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase sticky top-0 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {selectedCoord.user.wallet.transactions.map((tx: any) => {
                            const isCredit = tx.amount > 0;
                            return (
                              <tr key={tx.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-400">
                                  {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                </td>
                                <td className="px-4 py-3 text-gray-700 max-w-[12rem] truncate" title={tx.description ?? ""}>
                                  {tx.description || "No description provided"}
                                </td>
                                <td className="px-4 py-3 text-gray-500 font-medium">
                                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-wider">
                                    {tx.type}
                                  </span>
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${
                                  isCredit ? "text-emerald-600" : "text-red-500"
                                }`}>
                                  {isCredit ? "+" : ""}₦{tx.amount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${
                                    tx.status === "COMPLETED"
                                      ? "bg-green-50 text-green-700"
                                      : tx.status === "PENDING"
                                      ? "bg-yellow-50 text-yellow-700"
                                      : "bg-red-50 text-red-700"
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-150 bg-gray-50 p-6 text-center text-xs text-gray-400">
                      No transactions registered to this wallet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* MODAL 2: SUSPENSION REASON DIALOG */}
      {isSuspendOpen && selectedCoord && (
        <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <DialogContent className="max-w-md bg-white border-0 rounded-2xl shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">Suspend Coordinator Profile</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Place account limits on @{selectedCoord.user.username}. They will not be listed and cannot log in for the specified duration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSuspendSubmit} className="space-y-4 py-3">
              {/* Duration Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suspension Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>

              {/* Reason Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason for Suspension</label>
                <textarea
                  placeholder="e.g. Failure to collaborate, code validation violation, user complaints..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="h-24 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-pink-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSuspendOpen(false);
                    setSuspendReason("");
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={suspendMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 rounded-xl"
                >
                  {suspendMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply Suspension
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
