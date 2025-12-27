"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  XCircle,
  Hourglass,
  FileText,
  Star,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- 1. STRICT TYPES ---
type RouterOutputs = inferRouterOutputs<AppRouter>;
type Order = RouterOutputs["order"]["getMyOrders"][number];
type Quote = RouterOutputs["order"]["getMyQuotes"][number];
type NextRouter = ReturnType<typeof useRouter>;
type UserType = "vendor" | "client";

interface Tab {
  id: string;
  title: string;
  count: number;
  icon: React.ElementType;
}

// --- Helpers ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-orange-100 text-orange-700 border-orange-200",
    IN_DISPUTE: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? "border-gray-200 bg-gray-100 text-gray-700",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amount,
  );

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// --- Main Page ---
const OrdersPage = () => {
  const { profile } = useAuthStore();
  const router = useRouter();
  const isVendor = profile?.role === "VENDOR";

  const initialTab = useMemo(
    () => (isVendor ? "newLeads" : "pending"),
    [isVendor],
  );
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: quotes, isLoading: quotesLoading } =
    api.order.getMyQuotes.useQuery();
  const { data: orders, isLoading: ordersLoading } =
    api.order.getMyOrders.useQuery();

  // Filter Data
  const newLeads = quotes?.filter((q) => q.status === "PENDING") ?? [];
  const pendingQuotes = quotes?.filter((q) => q.status === "PENDING") ?? [];
  const activeOrders = orders?.filter((o) => o.status === "ACTIVE") ?? [];
  const completedOrders = orders?.filter((o) => o.status === "COMPLETED") ?? [];
  const cancelledOrders = orders?.filter((o) => o.status === "CANCELLED") ?? [];

  const vendorTabs: Tab[] = [
    {
      id: "newLeads",
      title: "New Leads",
      count: newLeads.length,
      icon: MessageSquare,
    },
    {
      id: "active",
      title: "Active Orders",
      count: activeOrders.length,
      icon: Briefcase,
    },
    {
      id: "completed",
      title: "Completed",
      count: completedOrders.length,
      icon: CheckCircle,
    },
    {
      id: "cancelled",
      title: "Cancelled",
      count: cancelledOrders.length,
      icon: XCircle,
    },
  ];

  const clientTabs: Tab[] = [
    {
      id: "pending",
      title: "Pending Quotes",
      count: pendingQuotes.length,
      icon: Hourglass,
    },
    {
      id: "active",
      title: "Active Events",
      count: activeOrders.length,
      icon: Briefcase,
    },
    {
      id: "completed",
      title: "Completed",
      count: completedOrders.length,
      icon: CheckCircle,
    },
    {
      id: "cancelled",
      title: "Cancelled",
      count: cancelledOrders.length,
      icon: XCircle,
    },
  ];

  const tabs = isVendor ? vendorTabs : clientTabs;
  const isLoading = quotesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-[120px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  const userType: UserType = isVendor ? "vendor" : "client";

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 text-gray-900">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-sm text-gray-500">
              Track your gigs, quotes, and history.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700",
              )}
            >
              <tab.icon
                className={cn(
                  "h-4 w-4",
                  activeTab === tab.id ? "text-pink-600" : "text-gray-400",
                )}
              />
              {tab.title}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    activeTab === tab.id
                      ? "bg-pink-100 text-pink-700"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isVendor ? (
            <>
              {activeTab === "newLeads" && (
                <QuoteList
                  quotes={newLeads}
                  userType="vendor"
                  router={router}
                />
              )}
              {activeTab === "active" && (
                <OrderList
                  orders={activeOrders}
                  userType="vendor"
                  router={router}
                />
              )}
              {activeTab === "completed" && (
                <OrderList
                  orders={completedOrders}
                  userType="vendor"
                  router={router}
                />
              )}
              {activeTab === "cancelled" && (
                <OrderList
                  orders={cancelledOrders}
                  userType="vendor"
                  router={router}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === "pending" && (
                <QuoteList
                  quotes={pendingQuotes}
                  userType="client"
                  router={router}
                />
              )}
              {activeTab === "active" && (
                <OrderList
                  orders={activeOrders}
                  userType="client"
                  router={router}
                />
              )}
              {activeTab === "completed" && (
                <OrderList
                  orders={completedOrders}
                  userType="client"
                  router={router}
                />
              )}
              {activeTab === "cancelled" && (
                <OrderList
                  orders={cancelledOrders}
                  userType="client"
                  router={router}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- QUOTE COMPONENTS ---

interface QuoteListProps {
  quotes: Quote[];
  userType: UserType;
  router: NextRouter;
}

const QuoteList = ({ quotes, userType, router }: QuoteListProps) => {
  if (quotes.length === 0)
    return <EmptyState label="No pending quotes found." />;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Service</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map((quote) => (
              <QuoteRow
                key={quote.id}
                quote={quote}
                userType={userType}
                router={router}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid */}
      <div className="grid gap-4 md:hidden">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            userType={userType}
            router={router}
          />
        ))}
      </div>
    </>
  );
};

interface QuoteItemProps {
  quote: Quote;
  userType: UserType;
  router: NextRouter;
}

const QuoteRow = ({ quote, userType, router }: QuoteItemProps) => {
  const isVendor = userType === "vendor";
  const profile = isVendor
    ? quote.client.clientProfile
    : quote.vendor.vendorProfile;
  const name = isVendor
    ? quote.client.clientProfile?.name
    : quote.vendor.vendorProfile?.companyName;
  const username = isVendor ? quote.client.username : quote.vendor.username;

  const displayName = name ?? username;
  const avatar =
    profile?.avatarUrl ??
    `https://placehold.co/40x40/f3f4f6/6b7280?text=${displayName.charAt(0)}`;

  return (
    <tr className="group hover:bg-gray-50/50">
      <td className="px-6 py-4 font-medium text-gray-900">{quote.title}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={avatar}
            alt=""
            width={32}
            height={32}
            className="rounded-full bg-gray-100 object-cover"
          />
          <span className="text-gray-700">{displayName}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-500">{formatDate(quote.eventDate)}</td>
      <td className="px-6 py-4 font-semibold text-gray-900">
        {formatCurrency(quote.price)}
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          size="sm"
          onClick={() => router.push(`/quote/${quote.id}`)}
          className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-pink-600"
        >
          {isVendor ? "Send Quote" : "View Quote"}
        </Button>
      </td>
    </tr>
  );
};

const QuoteCard = ({ quote, userType, router }: QuoteItemProps) => {
  const isVendor = userType === "vendor";
  const name = isVendor
    ? quote.client.clientProfile?.name
    : quote.vendor.vendorProfile?.companyName;
  const username = isVendor ? quote.client.username : quote.vendor.username;
  const displayName = name ?? username;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{quote.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <CalendarDays className="h-3.5 w-3.5" />{" "}
            {formatDate(quote.eventDate)}
          </p>
        </div>
        <StatusBadge status="PENDING" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-500">
            {/* If we had the avatar URL here we'd use it, otherwise simple initial */}
            {displayName.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="text-xs text-gray-500">
              {isVendor ? "Client" : "Vendor"}
            </p>
            <p className="font-medium text-gray-900">{displayName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Budget</p>
          <p className="font-bold text-gray-900">
            {formatCurrency(quote.price)}
          </p>
        </div>
      </div>

      <Button
        onClick={() => router.push(`/quote/${quote.id}`)}
        className="mt-4 w-full bg-gray-900 text-white hover:bg-gray-800"
      >
        {isVendor ? "Review & Send Quote" : "View Details"}
      </Button>
    </div>
  );
};

// --- ORDER COMPONENTS ---

interface OrderListProps {
  orders: Order[];
  userType: UserType;
  router: NextRouter;
}

const OrderList = ({ orders, userType, router }: OrderListProps) => {
  if (orders.length === 0) return <EmptyState label="No orders found." />;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Service</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                userType={userType}
                router={router}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid */}
      <div className="grid gap-4 md:hidden">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            userType={userType}
            router={router}
          />
        ))}
      </div>
    </>
  );
};

interface OrderItemProps {
  order: Order;
  userType: UserType;
  router: NextRouter;
}

const OrderRow = ({ order, userType, router }: OrderItemProps) => {
  const isVendor = userType === "vendor";
  const profile = isVendor
    ? order.client.clientProfile
    : order.vendor.vendorProfile;
  const name = isVendor
    ? order.client.clientProfile?.name
    : order.vendor.vendorProfile?.companyName;
  const username = isVendor ? order.client.username : order.vendor.username;
  const displayName = name ?? username;

  const avatar =
    profile?.avatarUrl ??
    `https://placehold.co/40x40?text=${displayName.charAt(0)}`;

  const completeOrder = api.order.completeOrder.useMutation({
    onSuccess: () => {
      toast.success("Marked as complete!");
      window.location.reload();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <tr className="group hover:bg-gray-50/50">
      <td className="px-6 py-4 font-mono text-xs text-gray-500">
        #{order.id.slice(0, 8)}
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        {order.quote.title}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={avatar}
            alt=""
            width={32}
            height={32}
            className="rounded-full bg-gray-100 object-cover"
          />
          <span className="text-gray-700">{displayName}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 font-semibold text-gray-900">
        {formatCurrency(order.amount)}
      </td>
      <td className="px-6 py-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/inbox?conversation=${order.quote.conversationId}`)
              }
            >
              <MessageSquare className="mr-2 h-4 w-4" /> Chat
            </DropdownMenuItem>
            {order.status === "ACTIVE" && !isVendor && (
              <DropdownMenuItem
                onClick={() => completeOrder.mutate({ orderId: order.id })}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Mark
                Complete
              </DropdownMenuItem>
            )}
            {order.status === "COMPLETED" && !isVendor && (
              <DropdownMenuItem
                onClick={() => router.push(`/orders/${order.id}/review`)}
              >
                <Star className="mr-2 h-4 w-4 text-yellow-500" /> Review
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

const OrderCard = ({ order, userType, router }: OrderItemProps) => {
  const isVendor = userType === "vendor";
  const name = isVendor
    ? order.client.clientProfile?.name
    : order.vendor.vendorProfile?.companyName;
  const username = isVendor ? order.client.username : order.vendor.username;
  const displayName = name ?? username;

  const completeOrder = api.order.completeOrder.useMutation({
    onSuccess: () => {
      toast.success("Marked as complete!");
      window.location.reload();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs text-gray-400">
            #{order.id.slice(0, 8)}
          </span>
          <h3 className="font-semibold text-gray-900">{order.quote.title}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
            {displayName.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
              {formatCurrency(order.amount)}
            </p>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() =>
              router.push(`/inbox?conversation=${order.quote.conversationId}`)
            }
          >
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </Button>
          {order.status === "ACTIVE" && !isVendor && (
            <Button
              size="sm"
              onClick={() => completeOrder.mutate({ orderId: order.id })}
              disabled={completeOrder.isPending}
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
    <div className="mb-3 rounded-full bg-white p-4 shadow-sm">
      <Briefcase className="h-8 w-8 text-gray-400" />
    </div>
    <p className="text-gray-500">{label}</p>
  </div>
);

export default OrdersPage;
