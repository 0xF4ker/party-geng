"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  FileCheck,
  Wallet,
  Settings,
  LogOut,
  ShieldCheck,
  ShieldUser,
  ChartColumnStacked,
  ListCheck,
  MessageSquareWarning,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Vendors", href: "/admin/vendors", icon: Store },
  { name: "Admins", href: "/admin/admins", icon: ShieldUser },
  { name: "Categories", href: "/admin/categories", icon: ChartColumnStacked },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "KYC", href: "/admin/kyc", icon: FileCheck },
  { name: "Finance", href: "/admin/finance", icon: Wallet },
  { name: "Reports", href: "/admin/reports", icon: MessageSquareWarning },
  { name: "Audit Log", href: "/admin/audit", icon: ListCheck },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-6">
      <div className="space-y-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 shadow-md shadow-pink-200">
            <span className="text-lg font-bold text-white">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Partygeng
            </h1>
            <span className="text-xs font-medium text-gray-500">
              Admin Workspace
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-pink-50 text-pink-600 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? "text-pink-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Logout Section */}
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Signed in as</p>
              <p className="text-sm font-bold text-gray-900">{role}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
