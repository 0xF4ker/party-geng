"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  XCircle,
  Hourglass, // For Clearing
  FileText, // For Quotes
  Star, // For Reviews
  Check, // FIX: Added missing Check icon
} from "lucide-react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type order = routerOutput["order"]["getMyOrders"][0];
type quote = routerOutput["order"]["getMyQuotes"][0];

// --- Type Definitions ---
interface Tab {
  id: string;
  title: string;
  count: number;
  icon: React.ElementType;
}

// --- Main Page Component ---
const OrdersPage = () => {
  const { profile } = useAuthStore();
  const router = useRouter();
  const isVendor = profile?.role === "VENDOR";
  const userType = isVendor ? "vendor" : "client";

  // Conditionally set the initial active tab
  const [activeTab, setActiveTab] = useState(isVendor ? "newLeads" : "pending");

  // Fetch quotes (for new leads)
  const { data: quotes, isLoading: quotesLoading } =
    api.order.getMyQuotes.useQuery();

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } =
    api.order.getMyOrders.useQuery();

  // Group data by status
  const newLeads = quotes?.filter((q) => q.status === "PENDING") ?? [];
  const pendingQuotes = quotes?.filter((q) => q.status === "PENDING") ?? [];
  const activeOrders = orders?.filter((o) => o.status === "ACTIVE") ?? [];
  const completedOrders = orders?.filter((o) => o.status === "COMPLETED") ?? [];
  const cancelledOrders = orders?.filter((o) => o.status === "CANCELLED") ?? [];

  // Update activeTab when userType changes
  useEffect(() => {
    setActiveTab(isVendor ? "newLeads" : "pending");
  }, [isVendor]);

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
      <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold">Manage Orders</h1>

        {/* Main Content Area */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Tabs */}
          <div className="flex items-center overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                title={tab.title}
                count={tab.count}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          {/* Order List */}
          <div className="divide-y divide-gray-100">
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
                    status="active"
                    router={router}
                  />
                )}
                {activeTab === "completed" && (
                  <OrderList
                    orders={completedOrders}
                    userType="vendor"
                    status="completed"
                    router={router}
                  />
                )}
                {activeTab === "cancelled" && (
                  <OrderList
                    orders={cancelledOrders}
                    userType="vendor"
                    status="cancelled"
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
                    status="active"
                    router={router}
                  />
                )}
                {activeTab === "completed" && (
                  <OrderList
                    orders={completedOrders}
                    userType="client"
                    status="completed"
                    router={router}
                  />
                )}
                {activeTab === "cancelled" && (
                  <OrderList
                    orders={cancelledOrders}
                    userType="client"
                    status="cancelled"
                    router={router}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const TabButton = ({
  title,
  count,
  icon: Icon,
  isActive,
  onClick,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    <Icon
      className={cn("h-4 w-4", isActive ? "text-pink-600" : "text-gray-400")}
    />
    {title}
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold",
        isActive ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600",
      )}
    >
      {count}
    </span>
  </button>
);

// Quote List Component (for pending quotes/new leads)
const QuoteList = ({
  quotes,
  userType,
  router,
}: {
  quotes: quote[];
  userType: string;
  router: ReturnType<typeof useRouter>;
}) => {
  if (quotes.length === 0) {
    return (
      <p className="p-10 text-center text-gray-500">
        {userType === "vendor"
          ? "No new leads at the moment."
          : "No pending quotes."}
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {quotes.map((quote) => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          userType={userType}
          router={router}
        />
      ))}
    </div>
  );
};

// Order List Component
const OrderList = ({
  orders,
  userType,
  status,
  router,
}: {
  orders: order[];
  userType: string;
  status: string;
  router: ReturnType<typeof useRouter>;
}) => {
  if (orders.length === 0) {
    return (
      <p className="p-10 text-center text-gray-500">
        No orders in this category.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          userType={userType}
          status={status}
          router={router}
        />
      ))}
    </div>
  );
};

// Quote Card Component
const QuoteCard = ({
  quote,
  userType,
  router,
}: {
  quote: quote;
  userType: string;
  router: ReturnType<typeof useRouter>;
}) => {
  const isVendor = userType === "vendor";
  const otherUser = isVendor ? quote.client : quote.vendor;

  const profile = isVendor
    ? quote.client.clientProfile // <-- This is safe
    : quote.vendor.vendorProfile; // <-- This is also safe

  const name = isVendor
    ? quote.client.clientProfile?.name
    : quote.vendor.vendorProfile?.companyName;
  const avatar =
    profile?.avatarUrl ??
    `https://placehold.co/40x40/ec4899/ffffff?text=${name?.charAt(0)}`;

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start space-x-4">
          <Image
            src={avatar}
            alt={name ?? "User"}
            className="h-12 w-12 shrink-0 rounded-full"
            width={48}
            height={48}
          />
          <div className="grow">
            <p className="font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-600">{quote.title}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <CalendarDays className="h-4 w-4" />
              {new Date(quote.eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start">
          <span className="text-xl font-bold text-gray-900">
            ₦{quote.price.toLocaleString()}
          </span>
          <div className="shrink-0">
            <ActionButton
              text={isVendor ? "Send Quote" : "View Quote"}
              icon={FileText}
              primary
              onClick={() => router.push("/inbox")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({
  order,
  userType,
  status,
  router,
}: {
  order: order;
  userType: string;
  status: string;
  router: ReturnType<typeof useRouter>;
}) => {
  const isVendor = userType === "vendor";
  const otherUser = isVendor ? order.client : order.vendor;

  const profile = isVendor
    ? order.client.clientProfile // <-- This is safe
    : order.vendor.vendorProfile; // <-- This is also safe

  const name = isVendor
    ? order.client.clientProfile?.name
    : order.vendor.vendorProfile?.companyName;
  const avatar =
    profile?.avatarUrl ??
    `https://placehold.co/40x40/ec4899/ffffff?text=${name?.charAt(0)}`;

  let actionButton;
  if (isVendor) {
    if (status === "active")
      actionButton = (
        <ActionButton
          text="View Chat"
          icon={MessageSquare}
          onClick={() => router.push("/inbox")}
        />
      );
    if (status === "completed")
      actionButton = (
        <ActionButton
          text="View Details"
          icon={FileText}
          onClick={() => router.push(`/orders/${order.id}`)}
        />
      );
  } else {
    if (status === "active")
      actionButton = (
        <ActionButton
          text="View Chat"
          icon={MessageSquare}
          onClick={() => router.push("/inbox")}
        />
      );
    if (status === "completed")
      actionButton = (
        <ActionButton
          text="Leave a Review"
          icon={Star}
          onClick={() => router.push(`/orders/${order.id}/review`)}
        />
      );
  }

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start space-x-4">
          <Image
            src={avatar}
            alt={name ?? "User"}
            className="h-12 w-12 shrink-0 rounded-full"
            width={48}
            height={48}
          />
          <div className="grow">
            <p className="font-semibold text-gray-800">{name}</p>
            <p className="text-sm text-gray-600">{order.quote.title}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <CalendarDays className="h-4 w-4" />
              {new Date(order.eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start">
          <span className="text-xl font-bold text-gray-900">
            ₦{order.amount.toLocaleString()}
          </span>
          <div className="shrink-0">{actionButton}</div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  text,
  icon: Icon,
  primary = false,
  onClick,
}: {
  text: string;
  icon: React.ElementType;
  primary?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:w-auto",
      primary
        ? "bg-pink-600 text-white hover:bg-pink-700"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    )}
  >
    <Icon className="h-4 w-4" />
    {text}
  </button>
);

export default OrdersPage;
