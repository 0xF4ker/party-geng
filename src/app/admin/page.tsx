import { api } from "@/trpc/server";
import { Suspense } from "react";
import {
  Users,
  Store,
  ShoppingBag,
  CreditCard,
  FileCheck,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns"; // Make sure to install: npm install date-fns

// --- 1. SKELETONS ---

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...(Array(4) as unknown as number[])].map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between">
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-8 w-8 rounded-full bg-gray-100"></div>
          </div>
          <div className="mt-4 h-8 w-1/3 rounded bg-gray-300"></div>
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...(Array(5) as unknown as number[])].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-gray-200"></div>
            <div className="h-3 w-1/4 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- 2. STATS COMPONENT ---

async function DashboardStats() {
  let stats;
  try {
    stats = await api.admin.getDashboardStats();
  } catch {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <ShieldAlert className="h-5 w-5" />
        <span>Failed to load critical stats.</span>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      label: "Total Revenue",
      value:
        stats.totalRevenue !== undefined
          ? formatCurrency(stats.totalRevenue)
          : "—",
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Orders",
      value: stats.orderCount?.toString() ?? "0",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending KYC",
      value: stats.pendingKycCount?.toString() ?? "0",
      icon: FileCheck,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Total Vendors",
      value: stats.vendorCount?.toString() ?? "0",
      icon: Store,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
            <div className={`rounded-full p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// --- 3. RECENT ACTIVITY COMPONENT (The Upgrade) ---

async function RecentActivityFeed() {
  // Fetch real logs from your new router
  const { logs } = await api.activityLog.getAllLogs({ limit: 6 });

  // Helper to format raw action strings
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Helper to get icon/color based on action type
  const getActionStyle = (action: string) => {
    if (action.includes("ORDER"))
      return { icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" };
    if (action.includes("PAYMENT") || action.includes("PAYOUT"))
      return {
        icon: CreditCard,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
      };
    if (action.includes("KYC") || action.includes("PROFILE"))
      return { icon: FileCheck, color: "text-orange-500", bg: "bg-orange-50" };
    if (action.includes("LOGIN"))
      return { icon: Users, color: "text-gray-500", bg: "bg-gray-50" };
    return { icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50" };
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No recent activity found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {logs.map((log) => {
        const style = getActionStyle(log.action);
        const Icon = style.icon;

        return (
          <div
            key={log.id}
            className="flex items-start gap-4 p-4 transition-colors hover:bg-gray-50"
          >
            {/* Icon */}
            <div
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}
            >
              <Icon className={`h-4 w-4 ${style.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                <span className="text-gray-600">
                  {log.user.username || log.user.email}
                </span>{" "}
                {formatAction(log.action)}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                })}

                {/* Optional: Show Entity ID if useful */}
                {log.entityType && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
                    {log.entityType}: {log.entityId?.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="border-t p-2 text-center">
        <Link
          href="/admin/logs"
          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          View all logs <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// --- 4. MAIN DASHBOARD PAGE ---

export default async function AdminDashboard() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-500">
            Overview of platform performance and pending tasks.
          </p>
        </div>
        <div className="hidden md:block">
          {/* Example of where you might put a date picker or export button */}
        </div>
      </div>

      {/* Stats Cards (Suspense allows instant page load while data fetches) */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity Feed (Takes up 2 columns on large screens) */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivityFeed />
          </Suspense>
        </div>

        {/* Quick Actions (Takes up 1 column) */}
        <div className="h-fit rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            <Link
              href="/admin/kyc"
              className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center gap-3">
                <FileCheck className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                Review Pending KYC
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
            </Link>

            <Link
              href="/admin/categories"
              className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition-all hover:border-purple-300 hover:bg-purple-50"
            >
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
                Manage Categories
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500" />
            </Link>

            <Link
              href="/admin/finance"
              className="group flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 transition-all hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-400 group-hover:text-emerald-500" />
                Financial Reports
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
