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

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Type Definitions ---
interface Order {
  id: number;
  clientName?: string;
  vendorName?: string;
  gigTitle: string;
  eventDate: string;
  avatar: string;
  price?: number;
}

interface Tab {
  id: string;
  title: string;
  count: number;
  icon: React.ElementType;
}

// --- Mock Data ---
const vendorOrders: Record<string, Order[]> = {
  newLeads: [
    {
      id: 1,
      clientName: "Adebayo P.",
      gigTitle: "Wedding DJ for my reception",
      eventDate: "Dec 15, 2025",
      avatar: "https://placehold.co/40x40/3b82f6/ffffff?text=A",
    },
    {
      id: 2,
      clientName: "Chioma E.",
      gigTitle: "Corporate end-of-year party",
      eventDate: "Dec 20, 2025",
      avatar: "https://placehold.co/40x40/10b981/ffffff?text=C",
    },
  ],
  active: [
    {
      id: 3,
      clientName: "Tunde O.",
      gigTitle: "Birthday Party DJ",
      eventDate: "Nov 10, 2025",
      price: 100000,
      avatar: "https://placehold.co/40x40/f59e0b/ffffff?text=T",
    },
  ],
  completed: [
    {
      id: 4,
      clientName: "Wale K.",
      gigTitle: "Product Launch MC",
      eventDate: "Oct 5, 2025",
      price: 80000,
      avatar: "https://placehold.co/40x40/ef4444/ffffff?text=W",
    },
  ],
  cancelled: [],
};

const clientOrders: Record<string, Order[]> = {
  pending: [
    {
      id: 1,
      vendorName: "DJ SpinMaster",
      gigTitle: "Wedding DJ for my reception",
      eventDate: "Dec 15, 2025",
      price: 150000,
      avatar: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
    },
  ],
  active: [
    {
      id: 3,
      vendorName: "Lagos Party Band",
      gigTitle: "Live Band for 30th Birthday",
      eventDate: "Nov 10, 2025",
      price: 250000,
      avatar: "https://placehold.co/40x40/3b82f6/ffffff?text=L",
    },
  ],
  completed: [
    {
      id: 4,
      vendorName: "SnapPro",
      gigTitle: "Corporate Event Photography",
      eventDate: "Oct 5, 2025",
      price: 120000,
      avatar: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
    },
  ],
  cancelled: [],
};
// --- End Mock Data ---

// --- Main Page Component ---
const OrdersPage = () => {
  const [userType, setUserType] = useState("vendor"); // 'vendor' or 'client'

  // Conditionally set the initial active tab
  const [activeTab, setActiveTab] = useState(
    userType === "vendor" ? "newLeads" : "pending",
  );

  // Update activeTab when userType changes
  useEffect(() => {
    setActiveTab(userType === "vendor" ? "newLeads" : "pending");
  }, [userType]);

  const vendorTabs: Tab[] = [
    {
      id: "newLeads",
      title: "New Leads",
      count: (vendorOrders.newLeads ?? []).length,
      icon: MessageSquare,
    },
    {
      id: "active",
      title: "Active Gigs",
      count: (vendorOrders.active ?? []).length,
      icon: Briefcase,
    },
    {
      id: "completed",
      title: "Completed",
      count: (vendorOrders.completed ?? []).length,
      icon: CheckCircle,
    },
    {
      id: "cancelled",
      title: "Cancelled",
      count: (vendorOrders.cancelled ?? []).length,
      icon: XCircle,
    },
  ];

  const clientTabs: Tab[] = [
    {
      id: "pending",
      title: "Pending Quotes",
      count: (clientOrders.pending ?? []).length,
      icon: Hourglass,
    },
    {
      id: "active",
      title: "Active Events",
      count: (clientOrders.active ?? []).length,
      icon: Briefcase,
    },
    {
      id: "completed",
      title: "Completed",
      count: (clientOrders.completed ?? []).length,
      icon: CheckCircle,
    },
    {
      id: "cancelled",
      title: "Cancelled",
      count: (clientOrders.cancelled ?? []).length,
      icon: XCircle,
    },
  ];

  const tabs = userType === "vendor" ? vendorTabs : clientTabs;

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold">Manage Orders</h1>

        {/* "Our Twist" - Toggle to show conditional logic */}
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="font-semibold text-purple-800">Demo:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserType("vendor")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  userType === "vendor"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Vendor
              </button>
              <button
                onClick={() => setUserType("client")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  userType === "client"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Client
              </button>
            </div>
            <p className="text-sm text-purple-700">
              {userType === "vendor"
                ? "Showing the order management page for a Vendor."
                : "Showing the order tracking page for a Client."}
            </p>
          </div>
        </div>

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
            {userType === "vendor" && (
              <>
                {activeTab === "newLeads" && (
                  <OrderList
                    orders={vendorOrders.newLeads ?? []}
                    userType="vendor"
                    status="newLeads"
                  />
                )}
                {activeTab === "active" && (
                  <OrderList
                    orders={vendorOrders.active ?? []}
                    userType="vendor"
                    status="active"
                  />
                )}
                {activeTab === "completed" && (
                  <OrderList
                    orders={vendorOrders.completed ?? []}
                    userType="vendor"
                    status="completed"
                  />
                )}
                {activeTab === "cancelled" && (
                  <OrderList
                    orders={vendorOrders.cancelled ?? []}
                    userType="vendor"
                    status="cancelled"
                  />
                )}
              </>
            )}
            {userType === "client" && (
              <>
                {activeTab === "pending" && (
                  <OrderList
                    orders={clientOrders.pending ?? []}
                    userType="client"
                    status="pending"
                  />
                )}
                {activeTab === "active" && (
                  <OrderList
                    orders={clientOrders.active ?? []}
                    userType="client"
                    status="active"
                  />
                )}
                {activeTab === "completed" && (
                  <OrderList
                    orders={clientOrders.completed ?? []}
                    userType="client"
                    status="completed"
                  />
                )}
                {activeTab === "cancelled" && (
                  <OrderList
                    orders={clientOrders.cancelled ?? []}
                    userType="client"
                    status="cancelled"
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

const OrderList = ({
  orders,
  userType,
  status,
}: {
  orders: Order[];
  userType: string;
  status: string;
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
        />
      ))}
    </div>
  );
};

const OrderCard = ({
  order,
  userType,
  status,
}: {
  order: Order;
  userType: string;
  status: string;
}) => {
  const isVendor = userType === "vendor";
  const title = isVendor ? order.clientName : order.vendorName;
  const avatar = isVendor ? order.avatar : order.avatar;

  let actionButton;
  if (isVendor) {
    if (status === "newLeads")
      actionButton = <ActionButton text="Send Quote" icon={FileText} primary />;
    if (status === "active")
      actionButton = <ActionButton text="View Chat" icon={MessageSquare} />;
    if (status === "completed")
      actionButton = <ActionButton text="View Details" icon={FileText} />;
  } else {
    if (status === "pending")
      actionButton = <ActionButton text="View Quote" icon={FileText} primary />;
    if (status === "active")
      actionButton = <ActionButton text="Mark as Complete" icon={Check} />;
    if (status === "completed")
      actionButton = <ActionButton text="Leave a Review" icon={Star} />;
  }

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Info */}
        <div className="flex items-start space-x-4">
          <Image
            src={avatar}
            alt={title ?? order.gigTitle ?? ""}
            className="h-12 w-12 shrink-0 rounded-full"
            width={40}
            height={40}
          />
          <div className="grow">
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-sm text-gray-600">{order.gigTitle}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <CalendarDays className="h-4 w-4" /> {order.eventDate}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start">
          {order.price && (
            <span className="text-xl font-bold text-gray-900">
              ₦{order.price.toLocaleString()}
            </span>
          )}
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
}: {
  text: string;
  icon: React.ElementType;
  primary?: boolean;
}) => (
  <button
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
