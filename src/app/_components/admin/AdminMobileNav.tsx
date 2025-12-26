"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wallet,
  Menu,
} from "lucide-react";

export function AdminMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Finance", href: "/admin/finance", icon: Wallet },
    // You can make this 'Menu' button open a Drawer for the other links
    { name: "Menu", href: "/admin/settings", icon: Menu },
  ];

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white px-6 pt-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                isActive ? "text-pink-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
