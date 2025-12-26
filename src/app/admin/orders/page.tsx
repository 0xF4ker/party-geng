"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Search,
  Eye,
  Filter,
  Calendar,
  User,
  Store,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Clock,
  Loader2,
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

// --- 1. STRICT TYPE INFERENCE ---
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type OrderItem = RouterOutputs["order"]["getAllOrders"]["items"][number];

// --- SUB-COMPONENTS & HELPERS ---

// Helper for Status Badges
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
    IN_DISPUTE: "bg-orange-100 text-orange-700 border-orange-200",
  };

  const icons: Record<string, LucideIcon> = {
    ACTIVE: Clock,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle,
    IN_DISPUTE: AlertOctagon,
  };

  const Icon = icons[status] ?? Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100"}`}
    >
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </span>
  );
};

interface MobileOrderCardProps {
  order: OrderItem;
  onClick: () => void;
}

function MobileOrderCard({ order, onClick }: MobileOrderCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="font-mono text-xs text-gray-500">
          #{order.id.slice(0, 8)}
        </Badge>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between py-2">
        {/* Client */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white bg-gray-100 shadow-sm">
            {order.client.clientProfile?.avatarUrl && (
              <img
                src={order.client.clientProfile.avatarUrl}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="text-xs">
            <span className="block text-gray-500">Client</span>
            <span className="block max-w-[80px] truncate font-medium text-gray-900">
              {order.client.clientProfile?.name ?? order.client.username}
            </span>
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="text-gray-300">→</div>

        {/* Vendor */}
        <div className="flex flex-row-reverse items-center gap-2 text-right">
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white bg-gray-100 shadow-sm">
            {order.vendor.vendorProfile?.avatarUrl && (
              <img
                src={order.vendor.vendorProfile.avatarUrl}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="text-xs">
            <span className="block text-gray-500">Vendor</span>
            <span className="block max-w-[80px] truncate font-medium text-gray-900">
              {order.vendor.vendorProfile?.companyName ?? order.vendor.username}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="font-bold text-gray-900">
          ₦{order.quote.price.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          {format(new Date(order.quote.eventDate), "MMM d, yyyy")}
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  // Properly typed status filter. 'undefined' means all.
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "COMPLETED" | "IN_DISPUTE" | "CANCELLED" | undefined
  >(undefined);

  // Use OrderItem type instead of 'any'
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- QUERY ---
  const { data, isLoading, refetch } = api.order.getAllOrders.useQuery({
    limit: 50,
    search: search || undefined,
    status: statusFilter,
  });

  // --- MUTATION ---
  const updateStatusMutation = api.order.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      void refetch();
      setIsSheetOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenDetail = (order: OrderItem) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  const handleStatusChange = (
    newStatus: "ACTIVE" | "COMPLETED" | "IN_DISPUTE" | "CANCELLED",
  ) => {
    if (!selectedOrder) return;
    const reason = prompt(`Reason for changing status to ${newStatus}?`);
    if (reason) {
      updateStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: newStatus,
        reason,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* 1. Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Track gigs & disputes.</p>
        </div>

        {/* 2. Controls Section */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search Order ID..."
              className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-sm focus:border-pink-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-48">
            <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pr-8 pl-10 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              value={statusFilter ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                // Type guard or cast logic for safety
                if (
                  val === "" ||
                  val === "ACTIVE" ||
                  val === "COMPLETED" ||
                  val === "IN_DISPUTE" ||
                  val === "CANCELLED"
                ) {
                  setStatusFilter(val === "" ? undefined : val);
                }
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_DISPUTE">In Dispute</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {/* Custom arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Event Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              data?.items.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-200">
                        {order.client.clientProfile?.avatarUrl && (
                          <img
                            src={order.client.clientProfile.avatarUrl}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {order.client.clientProfile?.name ??
                          order.client.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Store className="h-3 w-3 text-gray-400" />
                      <span>
                        {order.vendor.vendorProfile?.companyName ??
                          order.vendor.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₦{order.quote.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(order.quote.eventDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDetail(order)}
                    >
                      <Eye className="h-4 w-4 text-gray-400 hover:text-pink-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD GRID */}
      <div className="grid gap-4 md:hidden">
        {isLoading ? (
          <Loader2 className="mx-auto animate-spin" />
        ) : (
          data?.items.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              onClick={() => handleOpenDetail(order)}
            />
          ))
        )}
      </div>

      {/* --- DETAIL SHEET --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex h-full w-full flex-col border-l border-gray-200 bg-white p-0 shadow-2xl sm:max-w-xl">
          {/* 1. HEADER */}
          {selectedOrder && (
            <div className="flex-none border-b border-gray-100 bg-white px-8 py-6">
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 hover:bg-gray-100"
                >
                  Order #{selectedOrder.id.slice(0, 8)}
                </Badge>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="mt-4">
                <SheetTitle className="text-xl leading-tight font-bold text-gray-900">
                  {selectedOrder.quote.title}
                </SheetTitle>
                <SheetDescription className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  Created {format(new Date(selectedOrder.createdAt), "PPP p")}
                </SheetDescription>
              </div>
            </div>
          )}

          {/* 2. SCROLLABLE CONTENT */}
          {selectedOrder && (
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="space-y-8">
                {/* Involved Parties */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Involved Parties
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Client Card */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-pink-100 hover:bg-pink-50/30">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <User className="h-3.5 w-3.5" /> Client
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm">
                          {selectedOrder.client.clientProfile?.avatarUrl ? (
                            <img
                              src={selectedOrder.client.clientProfile.avatarUrl}
                              className="h-full w-full object-cover"
                              alt="Client"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-400">
                              {selectedOrder.client.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {selectedOrder.client.clientProfile?.name ??
                              selectedOrder.client.username}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {selectedOrder.client.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vendor Card */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-blue-100 hover:bg-blue-50/30">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Store className="h-3.5 w-3.5" /> Vendor
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm">
                          {selectedOrder.vendor.vendorProfile?.avatarUrl ? (
                            <img
                              src={selectedOrder.vendor.vendorProfile.avatarUrl}
                              className="h-full w-full object-cover"
                              alt="Vendor"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-400">
                              {selectedOrder.vendor.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {selectedOrder.vendor.vendorProfile?.companyName ??
                              selectedOrder.vendor.username}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {selectedOrder.vendor.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financials */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Transaction Details
                  </h4>
                  <div className="rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
                    <div className="grid grid-cols-2 divide-x divide-gray-100">
                      <div className="p-4">
                        <span className="block text-xs text-gray-500">
                          Total Amount
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-bold text-gray-900">
                            ₦{selectedOrder.quote.price.toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-gray-400">
                            NGN
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <span className="block text-xs text-gray-500">
                          Scheduled Date
                        </span>
                        <div className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          {format(
                            new Date(selectedOrder.quote.eventDate),
                            "MMM d, yyyy",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Control Panel */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-orange-600 uppercase">
                    <AlertOctagon className="h-3.5 w-3.5" /> Admin Control Panel
                  </h4>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
                    <p className="mb-4 text-sm leading-relaxed text-gray-600">
                      Use these actions to resolve disputes or correct system
                      errors.
                      <span className="font-semibold">
                        {" "}
                        These actions bypass the standard user flow.
                      </span>
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start gap-1 border-gray-200 bg-white p-3 hover:border-orange-300 hover:bg-orange-50"
                          onClick={() => handleStatusChange("IN_DISPUTE")}
                        >
                          <span className="text-sm font-semibold text-gray-900">
                            Mark Dispute
                          </span>
                          <span className="text-xs font-normal text-gray-500">
                            Pause transaction
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start gap-1 border-gray-200 bg-white p-3 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleStatusChange("CANCELLED")}
                        >
                          <span className="text-sm font-semibold text-red-700">
                            Force Cancel
                          </span>
                          <span className="text-xs font-normal text-red-600/70">
                            Refund client
                          </span>
                        </Button>
                      </div>

                      <Button
                        className="h-auto w-full items-center justify-between bg-emerald-600 p-3 text-white shadow-sm hover:bg-emerald-700"
                        onClick={() => handleStatusChange("COMPLETED")}
                      >
                        <span className="flex flex-col items-start">
                          <span className="font-semibold">
                            Force Complete Order
                          </span>
                          <span className="text-xs font-normal opacity-90">
                            Release funds to vendor
                          </span>
                        </span>
                        <CheckCircle className="h-5 w-5 opacity-80" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FOOTER */}
          <SheetFooter className="flex-none border-t border-gray-100 bg-gray-50/50 px-8 py-4 sm:justify-between">
            <div className="self-center text-xs text-gray-400">
              Order ID: {selectedOrder?.id}
            </div>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Close Panel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
