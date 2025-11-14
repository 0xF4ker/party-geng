"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  MessageSquare,
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type quote = routerOutput["quote"]["getMyQuotesAsVendor"][0];
type order = routerOutput["order"]["getMyActiveOrders"][0];

// --- Main Page Component ---
const VendorDashboardPage = () => {
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("leads");

  // Fetch real data from API
  const { data: stats, isLoading: statsLoading } =
    api.gig.getMyStats.useQuery();
  const { data: pendingQuotes, isLoading: quotesLoading } =
    api.quote.getMyQuotesAsVendor.useQuery({
      status: "PENDING",
    });
  const { data: activeOrders, isLoading: ordersLoading } =
    api.order.getMyActiveOrders.useQuery();

  // Effect to capture sidebar width
  useLayoutEffect(() => {
    const sidebarEl = sidebarRef.current;
    if (sidebarEl && window.innerWidth >= 1024) {
      setSidebarWidth(sidebarEl.offsetWidth);
    }

    const handleResize = () => {
      if (sidebarEl && window.innerWidth >= 1024) {
        if (!isSidebarSticky) {
          sidebarEl.style.width = "auto"; // Reset to get natural width
        }
        setSidebarWidth(sidebarEl.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarSticky]);

  // Effect for sticky sidebar
  useEffect(() => {
    if (window.innerWidth < 1024) return; // Only run sticky logic on desktop

    const sidebarEl = sidebarRef.current;
    const contentEl = contentRef.current;
    if (!sidebarEl || !contentEl) return;

    const topOffset = 127; // Your header height

    const handleScroll = () => {
      if (!sidebarEl || !contentEl) return;

      const contentRect = contentEl.getBoundingClientRect();
      // const sidebarRect = sidebarEl.getBoundingClientRect();
      const contentBottom = contentRect.bottom + window.scrollY - topOffset;
      const sidebarHeight = sidebarEl.offsetHeight;
      const stickyTop = document.documentElement.scrollTop + topOffset;

      const startStickyOffset = contentEl.offsetTop;

      if (stickyTop > startStickyOffset) {
        setIsSidebarSticky(true);
      } else {
        setIsSidebarSticky(false);
      }

      if (isSidebarSticky && stickyTop + sidebarHeight > contentBottom) {
        sidebarEl.style.transform = `translateY(${contentBottom - (stickyTop + sidebarHeight)}px)`;
      } else {
        sidebarEl.style.transform = "translateY(0px)";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSidebarSticky]);

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Column (Sticky Sidebar on Desktop) */}
          <div className="relative lg:col-span-1">
            {/* Mobile View: Static Card */}
            <div className="lg:hidden">
              <VendorSidebar />
            </div>
            {/* Desktop View: Sticky Wrapper */}
            <div
              ref={sidebarRef}
              className={cn(
                "hidden w-full transition-all duration-100 lg:block",
                isSidebarSticky ? "fixed" : "relative",
              )}
              style={
                isSidebarSticky
                  ? {
                      top: "127px",
                      width: `${sidebarWidth}px`, // Apply the saved width
                      transform: sidebarRef.current
                        ? sidebarRef.current.style.transform
                        : "translateY(0px)",
                    }
                  : {
                      width: "auto",
                      top: "auto",
                      transform: "translateY(0px)",
                    }
              }
            >
              <VendorSidebar />
            </div>
          </div>

          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-3" ref={contentRef}>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back!</h1>

            {/* Alert */}
            <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-4 shadow-sm">
              <div className="flex">
                <div className="shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-yellow-800">
                    Verify your Information
                  </p>
                  {/* FIX: Updated text as requested */}
                  <p className="mt-1 text-sm text-yellow-700">
                    To activate your profile, please complete your KYC
                    verification.
                  </p>
                  <button className="mt-2 rounded-md bg-yellow-600 px-3 py-1 text-sm font-semibold text-white hover:bg-yellow-700">
                    Verify Now
                  </button>
                </div>
              </div>
            </div>

            {/* "Our Twist": Key Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Monthly Earnings"
                value={
                  statsLoading
                    ? "..."
                    : `₦${(stats?.monthlyEarnings ?? 0).toLocaleString()}`
                }
                icon={DollarSign}
                color="text-green-600 bg-green-100"
              />
              <StatCard
                title="Pending Quotes"
                value={quotesLoading ? "..." : (pendingQuotes?.length ?? 0)}
                icon={MessageSquare}
                color="text-pink-600 bg-pink-100"
              />
              <StatCard
                title="Active Gigs"
                value={statsLoading ? "..." : (stats?.activeGigs ?? 0)}
                icon={Briefcase}
                color="text-blue-600 bg-blue-100"
              />
              <StatCard
                title="Active Orders"
                value={ordersLoading ? "..." : (activeOrders?.length ?? 0)}
                icon={TrendingUp}
                color="text-purple-600 bg-purple-100"
              />
            </div>

            {/* Main Task Area */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center border-b border-gray-200">
                <TabButton
                  title="New Leads"
                  count={pendingQuotes?.length ?? 0}
                  isActive={activeTab === "leads"}
                  onClick={() => setActiveTab("leads")}
                />
                <TabButton
                  title="Active Orders"
                  count={activeOrders?.length ?? 0}
                  isActive={activeTab === "orders"}
                  onClick={() => setActiveTab("orders")}
                />
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === "leads" && (
                  <NewLeadsSection
                    quotes={pendingQuotes}
                    isLoading={quotesLoading}
                  />
                )}
                {activeTab === "orders" && (
                  <ActiveOrdersSection
                    orders={activeOrders}
                    isLoading={ordersLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const VendorSidebar = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const { data: stats } = api.gig.getMyStats.useQuery();
  const { data: vendorProfile } = api.vendor.getMyProfile.useQuery();

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <Image
            src={
              vendorProfile?.avatarUrl ??
              "https://placehold.co/128x128/ec4899/ffffff?text=V"
            }
            alt={vendorProfile?.companyName ?? "Vendor"}
            className="h-16 w-16 rounded-full"
            width={64}
            height={64}
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {vendorProfile?.companyName ?? "Vendor"}
            </h2>
            <span className="text-sm text-gray-500">
              {vendorProfile?.level ?? "Level 0"}
            </span>
          </div>
        </div>
        <Link href="/manage_gigs/new">
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700">
            <Plus className="h-5 w-5" />
            Create New Gig
          </button>
        </Link>
        <Link href={`/v/${vendorProfile?.user.username ?? ""}`}>
          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100">
            <Eye className="h-5 w-5" />
            View Public Profile
          </button>
        </Link>
      </div>

      {/* Performance Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Performance</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-gray-600">My Level</span>
            <span className="font-semibold text-gray-900">
              {vendorProfile?.level ?? "Level 0"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-gray-600">Rating</span>
            <span className="flex items-center gap-1 font-semibold text-gray-900">
              <Star className="h-4 w-4 fill-current text-yellow-400" />{" "}
              {vendorProfile?.rating?.toFixed(1) ?? "0.0"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-gray-600">Total Gigs</span>
            <span className="font-semibold text-green-600">
              {stats?.totalGigs ?? 0}
            </span>
          </li>
        </ul>
      </div>

      {/* Availability Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Availability</h3>
        <p className="mb-4 text-sm text-gray-500">
          {isAvailable
            ? "You're available for new event bookings."
            : "You're not receiving new leads."}
        </p>
        <button
          onClick={() => setIsAvailable(!isAvailable)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors"
          style={{
            backgroundColor: isAvailable ? "#ecfdf5" : "#fef2f2",
            color: isAvailable ? "#065f46" : "#991b1b",
          }}
        >
          {isAvailable ? (
            <ToggleRight className="h-6 w-6" />
          ) : (
            <ToggleLeft className="h-6 w-6" />
          )}
          <span className="text-sm font-semibold">
            {isAvailable ? "Set as Unavailable" : "Set as Available"}
          </span>
        </button>
      </div>

      {/* Earnings Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Earnings</h3>
          <span className="text-xs font-semibold text-gray-500">
            {new Date()
              .toLocaleString("en-US", { month: "short", year: "numeric" })
              .toUpperCase()}
          </span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          ₦{(stats?.monthlyEarnings ?? 0).toLocaleString()}
        </p>
        <Link href="/v/earnings">
          <button className="mt-3 text-sm font-semibold text-pink-600 hover:text-pink-700">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center space-x-3">
      <div className={cn("rounded-full p-3", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const TabButton = ({
  title,
  count,
  isActive,
  onClick,
}: {
  title: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
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

const NewLeadsSection = ({
  quotes,
  isLoading,
}: {
  quotes?: quote[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading quotes...</div>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">No pending quote requests</p>
        <p className="mt-1 text-sm text-gray-400">New leads will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <div
          key={quote.id}
          className="flex items-start space-x-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 sm:items-center"
        >
          <Image
            src={
              quote.client.clientProfile?.avatarUrl ??
              "https://placehold.co/40x40/3b82f6/ffffff?text=C"
            }
            alt={quote.client.username}
            className="h-10 w-10 shrink-0 rounded-full"
            width={40}
            height={40}
          />
          <div className="grow">
            <div className="mb-1 flex flex-col justify-between sm:flex-row sm:items-center">
              <span className="font-semibold text-gray-800">
                {quote.client.username}
              </span>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(quote.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="mb-2 text-sm text-gray-600 sm:mb-0">
              {quote.title} - ₦{quote.price.toLocaleString()}
            </p>
          </div>
          <Link href={`/v/quotes/${quote.id}`}>
            <button className="shrink-0 rounded-md bg-pink-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700">
              View Quote
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
};

const ActiveOrdersSection = ({
  orders,
  isLoading,
}: {
  orders?: order[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Briefcase className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">No active orders</p>
        <p className="mt-1 text-sm text-gray-400">
          Booked events will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col rounded-lg border border-gray-200 p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
              {order.status}
            </span>
            <p className="mt-2 font-semibold text-gray-800">
              {order.quote.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Client: {order.client.username} | Date:{" "}
              {new Date(order.eventDate).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-3 shrink-0 sm:mt-0 sm:ml-4">
            <span className="text-xl font-bold text-gray-900">
              ₦{order.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VendorDashboardPage;
