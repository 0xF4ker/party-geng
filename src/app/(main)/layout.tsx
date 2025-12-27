"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";
import { CreatePostButton } from "@/app/_components/posts/CreatePostButton";
import { CreatePostModal } from "@/app/_components/posts/CreatePostModal";
import { EventChatButton } from "@/app/_components/event/EventChatButton";
import { MobileBottomNav } from "@/app/_components/layout/MobileBottomNav"; // Import here
import { Loader2 } from "lucide-react";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const { profile, isLoading } = useAuthStore();

  // Protect Admin Route
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
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  const isAdmin =
    profile &&
    (["ADMIN", "SUPPORT", "FINANCE"].includes(profile.role) ||
      profile.adminProfile);
  if (isAdmin) return null;

  // --- LOGIC ---

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

  // Determine if we should show the bottom nav (Only if logged in)
  const showMobileNav = !!profile;

  return (
    <>
      {!isProfilePage && <Header />}

      {/* Add padding-bottom on mobile if nav is visible to prevent overlap */}
      <main className={showMobileNav ? "pb-20 lg:pb-0" : ""}>{children}</main>

      {!isProfilePage && <Footer />}

      {showCreatePostButton && <CreatePostButton />}
      {showEventChatButton && <EventChatButton />}

      <CreatePostModal />

      {/* The New Mobile Navbar */}
      <MobileBottomNav />
    </>
  );
}
