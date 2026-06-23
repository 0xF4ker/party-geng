"use client";
import React, { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useUserType } from "@/hooks/useUserType";
import { useRouter } from "next/navigation";
type routerOutput = inferRouterOutputs<AppRouter>;
type quote = routerOutput["quote"]["getMyQuotesAsVendor"][0];
type order = routerOutput["order"]["getMyActiveOrders"][0];
const VendorDashboardPage = () => {
  const { isVendor, loading } = useUserType();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("leads");
  const { data: pendingQuotes, isLoading: quotesLoading } =
    api.quote.getMyQuotesAsVendor.useQuery({
      status: "PENDING",
    });
  const { data: activeOrders, isLoading: ordersLoading } =
    api.order.getMyActiveOrders.useQuery();
  const { data: wallet } = api.payment.getWallet.useQuery();
  useEffect(() => {
    if (!loading && !isVendor) {
      router.push("/");
    }
  }, [loading, isVendor, router]);
  if (loading || !isVendor) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }
  return (
    <div className="bg-transparent pt-[122px] text-[var(--l-text)] lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
          {/* Left Column (Sticky Sidebar on Desktop) */}
          <div className="relative lg:col-span-1">
            {/* Mobile View: Static Card */}
            <div className="lg:hidden">
              <VendorSidebar />
            </div>
            {/* Desktop View: Sticky Wrapper - using CSS sticky */}
            <div className="hidden lg:sticky lg:top-36 lg:block">
              <VendorSidebar />
            </div>
          </div>
          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-3">
            <h1 className="text-3xl font-bold text-[var(--l-text)]">Welcome back!</h1>
            {/* Alert */}
            {/* <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-4 shadow-sm">
              <div className="flex">
                <div className="shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-yellow-800">
                    Verify your Information
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    To activate your profile, please complete your KYC
                    verification.
                  </p>
                  <button className="mt-2 rounded-md bg-yellow-600 px-3 py-1 text-sm font-semibold text-white hover:bg-yellow-700">
                    Verify Now
                  </button>
                </div>
              </div>
            </div> */}
            {/* "Our Twist": Key Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Total Earnings"
                value={
                  wallet ? `₦${wallet.totalEarnings.toLocaleString()}` : "..."
                }
                icon={DollarSign}
                accentColor="var(--l-gold)"
                lightColor="rgba(255, 190, 11, 0.1)"
              />
              <StatCard
                title="Pending Quotes"
                value={quotesLoading ? "..." : (pendingQuotes?.length ?? 0)}
                icon={MessageSquare}
                accentColor="var(--l-brand-pink)"
                lightColor="rgba(247, 37, 133, 0.1)"
              />
              <StatCard
                title="Active Orders"
                value={ordersLoading ? "..." : (activeOrders?.length ?? 0)}
                icon={TrendingUp}
                accentColor="var(--l-brand-purple)"
                lightColor="rgba(114, 9, 183, 0.1)"
              />
            </div>
            {/* Main Task Area */}
            <div className="l-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--l-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
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
const VendorSidebar = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const { data: vendorProfile } = api.vendor.getMyProfile.useQuery();
  const { data: wallet } = api.payment.getWallet.useQuery();
  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="l-card p-6">
        <div className="flex items-center space-x-4">
          <Image
            src={
              vendorProfile?.avatarUrl ??
              "https://placehold.co/128x128/ec4899/ffffff?text=V"
            }
            alt={vendorProfile?.companyName ?? "Vendor"}
            className="h-16 w-16 rounded-full border-2 border-[var(--l-brand-pink)] p-0.5"
            width={64}
            height={64}
          />
          <div>
            <h2 className="text-xl font-bold text-[var(--l-text)]">
              {vendorProfile?.companyName ?? "Vendor"}
            </h2>
            <span className="text-sm text-[var(--l-brand-pink)]">
              {vendorProfile?.level ?? "Level 0"}
            </span>
          </div>
        </div>
        <Link href={`/v/${vendorProfile?.user.username ?? ""}`}>
          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--l-border)] py-2.5 font-semibold text-[var(--l-text)] transition-colors hover:bg-[rgba(255,255,255,0.05)]">
            <Eye className="h-5 w-5 text-[var(--l-text-muted)]" />
            View Public Profile
          </button>
        </Link>
      </div>
      {/* Performance Card */}
      <div className="l-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--l-text)]">Performance</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-[var(--l-text-muted)]">My Level</span>
            <span className="font-semibold text-[var(--l-brand-pink)]">
              {vendorProfile?.level ?? "Level 0"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-[var(--l-text-muted)]">Rating</span>
            <span className="flex items-center gap-1 font-semibold text-[var(--l-text)]">
              <Star className="h-4 w-4 fill-current text-[var(--l-gold)]" />{" "}
              {vendorProfile?.rating?.toFixed(1) ?? "0.0"}
            </span>
          </li>
        </ul>
      </div>
      {/* Availability Card */}
      <div className="l-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--l-text)]">Availability</h3>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              isAvailable ? "bg-[var(--l-brand-pink)] shadow-[0_0_12px_rgba(247,37,133,0.5)]" : "bg-[rgba(255,255,255,0.1)]",
            )}
            role="switch"
            aria-checked={isAvailable}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
                isAvailable ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
        <p className="text-xs text-[var(--l-text-muted)]">
          {isAvailable
            ? "You're open for new bookings."
            : "You're not accepting new leads."}
        </p>
      </div>
      {/* Wallet Balance Card */}
      <div
        className="rounded-2xl p-5 text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, #7209b7, #b5179e)",
          boxShadow: "0 8px 24px rgba(114,9,183,0.25)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/70">Available Balance</h3>
        </div>
        <p className="mt-1 text-3xl font-bold">
          {wallet ? `₦${wallet.availableBalance.toLocaleString()}` : "..."}
        </p>
        <Link href="/wallet">
          <button className="mt-4 w-full rounded-xl bg-white/15 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25">
            View Wallet →
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
  accentColor,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accentColor: string;
  lightColor: string;
}) => (
  <div
    className="relative overflow-hidden l-card p-5 group"
    style={{ borderLeft: `3px solid ${accentColor}` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--l-text-muted)]">{title}</p>
        <p className="mt-1 text-2xl font-bold text-[var(--l-text)]">{value}</p>
      </div>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.05)` }}
      >
        <Icon className="h-6 w-6" style={{ color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor})` }} />
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
      "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all",
      isActive
        ? "bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] text-white shadow-[0_4px_12px_rgba(247,37,133,0.3)]"
        : "bg-transparent text-[var(--l-text-muted)] hover:bg-black/5 hover:text-[var(--l-text)]",
    )}
  >
    {title}
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold",
        isActive ? "bg-white/20 text-white" : "bg-[rgba(255,255,255,0.1)] text-[var(--l-text-muted)]",
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
          className="flex items-center gap-4 l-glass rounded-xl p-4 transition-all hover:border-[var(--l-brand-pink)] hover:bg-[rgba(247,37,133,0.05)] sm:items-center"
          style={{ borderLeft: "3px solid var(--l-brand-pink)" }}
        >
          <Image
            src={
              quote.client.clientProfile?.avatarUrl ??
              "https://placehold.co/40x40/3b82f6/ffffff?text=C"
            }
            alt={quote.client.username}
            className="h-10 w-10 shrink-0 rounded-full border border-[var(--l-border)]"
            width={40}
            height={40}
          />
          <div className="grow min-w-0">
            <div className="mb-1 flex flex-col justify-between sm:flex-row sm:items-center">
              <span className="font-semibold text-[var(--l-text)]">
                {quote.client.username}
              </span>
              <span className="text-xs text-[var(--l-text-muted)]">
                {formatDistanceToNow(new Date(quote.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="mb-2 text-sm text-[var(--l-text-muted)] sm:mb-0 truncate">
              {quote.title} - <span className="font-semibold text-[var(--l-brand-pink)]">₦{quote.price.toLocaleString()}</span>
            </p>
          </div>
          <Link href={`/v/quotes/${quote.id}`} className="shrink-0">
            <button className="l-btn-primary py-1.5 px-4 text-xs">
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
          className="flex flex-col l-glass rounded-xl p-4 transition-all hover:border-[var(--l-brand-purple)] hover:bg-[rgba(114,9,183,0.05)] sm:flex-row sm:items-center sm:justify-between"
          style={{ borderLeft: "3px solid var(--l-brand-purple)" }}
        >
          <div>
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[var(--l-gold)]"
            >
              {order.status}
            </span>
            <p className="mt-2 font-semibold text-[var(--l-text)]">
              {order.quote.title}
            </p>
            <p className="mt-1 text-sm text-[var(--l-text-muted)]">
              Client: {order.client.username} | Date:{" "}
              {new Date(order.eventDate).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-3 shrink-0 sm:mt-0 sm:ml-4">
            <span className="text-xl font-bold text-[var(--l-text)] drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              ₦{order.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
export default VendorDashboardPage;
