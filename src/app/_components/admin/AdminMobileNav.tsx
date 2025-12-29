"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  FileCheck,
  Wallet,
  Settings,
  LogOut,
  ShieldUser,
  ChartColumnStacked,
  ListCheck,
  Menu,
  MessageSquareWarning,
  CalendarX,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// Reuse the configuration to ensure consistency
const fullMenuItemsConfig = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPPORT", "FINANCE"],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN", "SUPPORT", "FINANCE"],
  },
  {
    name: "Vendors",
    href: "/admin/vendors",
    icon: Store,
    roles: ["ADMIN", "SUPPORT", "FINANCE"],
  },
  { name: "Admins", href: "/admin/admins", icon: ShieldUser, roles: ["ADMIN"] },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: ChartColumnStacked,
    roles: ["ADMIN"],
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    roles: ["ADMIN", "SUPPORT"],
  },
  {
    name: "Events",
    href: "/admin/events",
    icon: CalendarX,
    roles: ["ADMIN", "SUPPORT"],
  },
  {
    name: "KYC",
    href: "/admin/kyc",
    icon: FileCheck,
    roles: ["ADMIN", "SUPPORT"],
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: Wallet,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: MessageSquareWarning,
    roles: ["ADMIN", "SUPPORT"],
  },
  {
    name: "Audit Log",
    href: "/admin/audit",
    icon: ListCheck,
    roles: ["ADMIN", "SUPPORT", "FINANCE"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function AdminMobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Filter full menu
  const fullMenuItems = fullMenuItemsConfig.filter((item) =>
    item.roles.includes(role),
  );

  // Dynamic Bottom Nav based on Role Priority
  // We want to show the most relevant items for the user's role
  const getBottomNavItems = () => {
    const base = [{ name: "Home", href: "/admin", icon: LayoutDashboard }];

    if (role === "FINANCE") {
      return [
        ...base,
        { name: "Finance", href: "/admin/finance", icon: Wallet },
        { name: "Vendors", href: "/admin/vendors", icon: Store },
        { name: "Users", href: "/admin/users", icon: Users },
      ];
    }

    if (role === "SUPPORT") {
      return [
        ...base,
        { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
        { name: "Events", href: "/admin/events", icon: CalendarX },
        { name: "Reports", href: "/admin/reports", icon: MessageSquareWarning },
      ];
    }

    // Default (ADMIN)
    return [
      ...base,
      { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Finance", href: "/admin/finance", icon: Wallet },
    ];
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-around px-2">
        {/* Render Primary Bottom Links */}
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                isActive ? "text-pink-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Render 'Menu' Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                open ? "text-pink-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Menu className="h-6 w-6" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="flex w-[80%] flex-col p-0 sm:max-w-sm"
          >
            <SheetHeader className="border-b border-gray-100 p-6 text-left">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-white">
                  P
                </div>
                Partygeng Admin
              </SheetTitle>
            </SheetHeader>

            {/* Scrollable Menu Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="grid gap-1">
                {fullMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-pink-50 text-pink-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isActive ? "text-pink-600" : "text-gray-400"}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="my-6 border-t border-gray-100" />

              <div className="space-y-4">
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Close Menu
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
