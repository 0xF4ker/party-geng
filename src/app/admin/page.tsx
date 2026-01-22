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
  Banknote,
  AlertOctagon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// --- 1. SKELETONS ---
function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
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
      {[1, 2, 3, 4, 5].map((i) => (
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

// --- 2. DYNAMIC STATS COMPONENT ---

async function DashboardStats() {
  let stats;
  try {
    stats = await api.admin.getDashboardStats();
  } catch (e) {
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

  // Define all possible cards
  const allCards = [
    // FINANCE / ADMIN CARDS
    {
      key: "totalRevenue",
      label: "Platform Revenue",
      value:
        stats.totalRevenue !== undefined
          ? formatCurrency(stats.totalRevenue)
          : null,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      key: "totalVolume",
      label: "Total GMV (Volume)",
      value:
        stats.totalVolume !== undefined
          ? formatCurrency(stats.totalVolume)
          : null,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "pendingPayoutsVolume",
      label: "Pending Payouts",
      value:
        stats.pendingPayoutsVolume !== undefined
          ? formatCurrency(stats.pendingPayoutsVolume)
          : null,
      icon: CreditCard,
      color: "text-orange-600",
      bg: "bg-orange-50",
      subtext: stats.pendingPayoutsCount
        ? `${stats.pendingPayoutsCount} requests`
        : undefined,
    },

    // SUPPORT / ADMIN CARDS
    {
      key: "userCount",
      label: "Total Users",
      value: stats.userCount?.toLocaleString(),
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      key: "pendingKybCount",
      label: "Pending KYB",
      value: stats.pendingKybCount?.toString(),
      icon: FileCheck,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      key: "orderCount",
      // Label changes based on role context
      label: stats.role === "SUPPORT" ? "Active Disputes" : "Active Orders",
      value: stats.orderCount?.toString(),
      icon: stats.role === "SUPPORT" ? AlertOctagon : ShoppingBag,
      color: stats.role === "SUPPORT" ? "text-red-600" : "text-purple-600",
      bg: stats.role === "SUPPORT" ? "bg-red-50" : "bg-purple-50",
    },
  ];

  // Filter out cards that have no data (undefined)
  const visibleCards = allCards.filter(
    (c) => c.value !== null && c.value !== undefined,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visibleCards.map((stat, i) => (
        <div
          key={stat.key}
          className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-pink-100 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
            <div className={`rounded-full p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.subtext && (
              <p className="mt-1 text-xs text-gray-500">{stat.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- 3. RECENT ACTIVITY COMPONENT ---

async function RecentActivityFeed() {
  // We fetch a small batch for the dashboard
  const { logs } = await api.activityLog.getAllLogs({ limit: 6 });

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActionStyle = (action: string) => {
    if (action.includes("ORDER"))
      return { icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" };
    if (action.includes("PAYMENT") || action.includes("PAYOUT"))
      return {
        icon: CreditCard,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
      };
    if (action.includes("KYB") || action.includes("PROFILE"))
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
            <div
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}
            >
              <Icon className={`h-4 w-4 ${style.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                <span className="font-semibold text-gray-700">
                  {log.user.username || "Unknown"}
                </span>
                <span className="text-gray-500">
                  {" "}
                  {formatAction(log.action)}
                </span>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                })}

                {log.entityType && (
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {log.entityType}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="border-t bg-gray-50/50 p-3 text-center">
        <Link
          href="/admin/audit"
          className="inline-flex items-center text-xs font-semibold text-pink-600 hover:text-pink-700"
        >
          View Audit Trail <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// --- 4. MAIN PAGE ---

export default async function AdminDashboard() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Live overview of platform performance.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity (Left 2 cols) */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/30 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Activity className="h-4 w-4 text-pink-500" />
              System Activity
            </h2>
          </div>
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivityFeed />
          </Suspense>
        </div>

        {/* Quick Actions (Right 1 col) */}
        <div className="h-fit rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            <QuickActionLink
              href="/admin/kyb"
              icon={FileCheck}
              label="Review KYB"
              color="text-orange-500"
              bg="hover:bg-orange-50 hover:border-orange-200"
            />
            <QuickActionLink
              href="/admin/categories"
              icon={Store}
              label="Manage Categories"
              color="text-purple-500"
              bg="hover:bg-purple-50 hover:border-purple-200"
            />
            <QuickActionLink
              href="/admin/finance"
              icon={CreditCard}
              label="Finance Reports"
              color="text-emerald-500"
              bg="hover:bg-emerald-50 hover:border-emerald-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for Quick Action Links
interface QuickActionLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}

function QuickActionLink({
  href,
  icon: Icon,
  label,
  color,
  bg,
}: QuickActionLinkProps) {
  return (
    <Link
      href={href}
      className={`group flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-600 transition-all ${bg}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
    </Link>
  );
}
