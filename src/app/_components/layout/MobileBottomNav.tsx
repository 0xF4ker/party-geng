"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  ListChecks,
  Wallet,
  Calendar,
  Flame,
  MessageCircle, // Cleaner chat icon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Fetch unread count
  const { data: unreadConvoCount } =
    api.chat.getUnreadConversationCount.useQuery(undefined, {
      enabled: !!user,
    });

  if (loading || !user) return null;

  const isVendor = user.role === "VENDOR";
  const username = user.username;

  const vendorLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Orders",
      href: "/manage_orders",
      icon: ListChecks,
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: MessageCircle,
      badge: unreadConvoCount, // Pass count
    },
    {
      label: "Wallet",
      href: "/wallet",
      icon: Wallet,
    },
    {
      label: "Profile",
      href: `/v/${username}`,
      icon: User,
    },
  ];

  const clientLinks = [
    {
      label: "Trending",
      href: "/trending",
      icon: Flame,
    },
    {
      label: "Orders",
      href: "/manage_orders",
      icon: ListChecks,
    },
    {
      label: "Events",
      href: "/manage_events",
      icon: Calendar,
    },
    {
      label: "Inbox",
      href: "/inbox",
      icon: MessageCircle,
      badge: unreadConvoCount,
    },
    {
      label: "Profile",
      href: `/c/${username}`,
      icon: User,
    },
  ];

  const links = isVendor ? vendorLinks : clientLinks;

  return (
    <div className="pb-safe fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] lg:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.label === "Profile" && pathname.includes(username));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1.5 pb-1",
                isActive
                  ? "text-pink-600"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <div className="relative">
                {/* Icon */}
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive && "fill-pink-100 stroke-pink-600", // Subtle fill for active state
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Notification Badge - Only renders if count > 0 */}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="animate-in zoom-in absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-[10px] leading-none font-medium",
                  isActive ? "font-bold" : "",
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
