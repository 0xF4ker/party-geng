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
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
export const MobileBottomNav = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
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
      badge: unreadConvoCount,
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
    <div className="pb-safe fixed bottom-0 left-0 z-50 w-full pt-1 lg:hidden"
         style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--l-border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.05)' }}>
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
                "group relative flex flex-1 flex-col items-center justify-center gap-1 py-1",
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-200",
                isActive ? "bg-[rgba(247,37,133,0.15)] shadow-[0_0_12px_rgba(247,37,133,0.2)]" : "group-hover:bg-[rgba(0,0,0,0.05)]"
              )}>
                {/* Icon */}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-[var(--l-brand-pink)] drop-shadow-[0_0_8px_rgba(247,37,133,0.5)]" : "text-[var(--l-text-muted)] group-hover:text-[var(--l-text)]"
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
                  "text-[10px] leading-none font-medium transition-colors mt-0.5",
                  isActive ? "font-bold text-[var(--l-brand-pink)]" : "text-[var(--l-text-muted)] group-hover:text-[var(--l-text)]"
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
