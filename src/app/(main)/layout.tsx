"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth"; 
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";
import { CreatePostButton } from "@/app/_components/posts/CreatePostButton";
import { CreatePostModal } from "@/app/_components/posts/CreatePostModal";
import { EventChatButton } from "@/app/_components/event/EventChatButton";
import { Loader2 } from "lucide-react";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 1. Get auth state
  const { profile, isLoading } = useAuthStore();

  // 2. Protect the layout: Redirect Admins to the Dashboard
  useEffect(() => {
    // Only check once loading is done and we have a profile
    if (!isLoading && profile) {
      const adminRoles = ["ADMIN", "SUPPORT", "FINANCE"];
      
      // Check if user has an admin role OR has an admin profile linked
      if (adminRoles.includes(profile.role) || profile.adminProfile) {
        router.replace("/admin");
      }
    }
  }, [profile, isLoading, router]);

  // 3. Show a loader while checking auth to prevent content flash
  //    This ensures Admins never see the "Client" view, even for a split second.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  // 4. If user is an Admin, return null (the useEffect will handle the redirect)
  //    This prevents the layout below from rendering if the redirect is pending.
  const isAdmin = profile && (["ADMIN", "SUPPORT", "FINANCE"].includes(profile.role) || profile.adminProfile);
  if (isAdmin) return null;

  // --- EXISTING LOGIC ---

  const isProfilePage =
    pathname.startsWith("/c/") || pathname.startsWith("/v/") || pathname.startsWith("/wishlist/");

  const showCreatePostButton =
    pathname.startsWith("/c/") ||
    pathname.startsWith("/v/") ||
    pathname === "/trending" ||
    pathname.startsWith("/post/");

  const showEventChatButton = pathname.includes("/board");

  return (
    <>
      {!isProfilePage && <Header />}
      <main>{children}</main>
      {!isProfilePage && <Footer />}
      
      {showCreatePostButton && <CreatePostButton />}
      {showEventChatButton && <EventChatButton />}

      <CreatePostModal />
    </>
  );
}
