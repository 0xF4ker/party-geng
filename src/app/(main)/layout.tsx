"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";
import { CreatePostButton } from "@/app/_components/posts/CreatePostButton";
import { CreatePostModal } from "@/app/_components/posts/CreatePostModal";
import { EventChatButton } from "@/app/_components/event/EventChatButton";
import { MobileBottomNav } from "@/app/_components/layout/MobileBottomNav";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useAuthStore();
  useEffect(() => {
    if (!isLoading && profile) {
      const adminRoles = ["ADMIN", "SUPPORT", "FINANCE"];
      if (adminRoles.includes(profile.role) || profile.adminProfile) {
        router.replace("/admin");
      }
    }
  }, [profile, isLoading, router]);
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--l-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--l-brand-pink)] drop-shadow-[0_0_8px_rgba(247,37,133,0.5)]" />
      </div>
    );
  }
  const isAdmin =
    profile &&
    (["ADMIN", "SUPPORT", "FINANCE"].includes(profile.role) ||
      profile.adminProfile);
  if (isAdmin) return null;
  const isProfilePage =
    pathname.startsWith("/c/") ||
    pathname.startsWith("/v/") ||
    pathname.startsWith("/wishlist/");
  const showCreatePostButton =
    pathname.startsWith("/c/") ||
    pathname.startsWith("/v/") ||
    pathname === "/trending" ||
    pathname.startsWith("/post/");
  const showEventChatButton = pathname.includes("/board");
  const showMobileNav = !!profile;
  return (
    <>
      {!isProfilePage && <Header />}
      <main className={cn("min-h-screen", showMobileNav ? "pb-20 lg:pb-0" : "")}>
        {children}
      </main>
      {!isProfilePage && <Footer />}
      {showCreatePostButton && <CreatePostButton />}
      {showEventChatButton && <EventChatButton />}
      <CreatePostModal />
      {/* The New Mobile Navbar */}
      <MobileBottomNav />
    </>
  );
}
