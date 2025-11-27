"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Mail, Flame, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Skeleton } from "@/components/ui/skeleton";
import LoginJoinComponent from "../LoginJoinComponent";
import GlobalSearch from "../home/GlobalSearch";
import MobileMenu from "../home/MobileMenu";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CartIcon } from "../cart/CartIcon";

type routerOutput = inferRouterOutputs<AppRouter>;
type EventWithWishlist = routerOutput["wishlist"]["getByEventId"];

// Modal from Header.tsx
const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative h-full w-full sm:h-auto sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Main component
const NewWishlistHeader = ({ event }: { event: EventWithWishlist }) => {
  const { user, loading, signOut } = useAuth();

  // States from Header.tsx
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // States from ProfileHeader.tsx
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  const { data: unreadConvoCount } =
    api.chat.getUnreadConversationCount.useQuery(undefined, {
      enabled: !!user,
    });
  const { data: searchList } = api.category.getSearchList.useQuery();

  // --- Derived State ---
  const isVendor =
    user?.vendorProfile !== null && user?.vendorProfile !== undefined;
  const isGuest = !user;
  const avatarUrl = isVendor
    ? user?.vendorProfile?.avatarUrl
    : user?.clientProfile?.avatarUrl;
  const displayName = isVendor
    ? (user?.vendorProfile?.companyName ?? user?.username)
    : (user?.clientProfile?.name ?? user?.username);

  // --- Handlers from Header.tsx ---
  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // --- Scroll Effects ---
  useEffect(() => {
    const handleScroll = () => {
      // Header stickiness
      if (window.scrollY > 50) {
        setIsHeaderSticky(true);
      } else {
        setIsHeaderSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Other Effects ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const headerTextColor = isHeaderSticky ? "text-gray-800" : "text-white";
  const headerIconColor = isHeaderSticky
    ? "text-gray-600 hover:text-pink-500"
    : "text-white hover:text-pink-300";

  return (
    <>
      <div ref={headerRef} className="relative bg-white">
        {/* --- Merged Header --- */}
        <header
          className={cn(
            "fixed top-0 right-0 left-0 z-40 w-full transition-all duration-300",
            isHeaderSticky ? "bg-white shadow-md" : "bg-transparent",
            headerTextColor,
          )}
        >
          <div className="relative container mx-auto flex h-16 items-center justify-between px-4">
            {/* Left Side: Hamburger + Logo */}
            <div className="flex shrink-0 items-center">
              <button onClick={toggleMobileMenu} className="lg:hidden">
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="PartyGeng Logo"
                  width={150}
                  height={50}
                  className={cn(
                    "ml-4 h-6 w-auto object-contain",
                    !isHeaderSticky && "brightness-0 invert",
                  )}
                />
              </Link>
            </div>

            {/* Middle: Search Bar (hidden on profile page for now) */}
            <div className="mx-4 hidden grow sm:flex lg:mx-16">
              {searchList && (
                <GlobalSearch
                  items={searchList}
                  className="w-full max-w-lg transition-all"
                />
              )}
            </div>

            {/* Right Side: Nav Links */}
            {loading ? (
              <div className="flex items-center space-x-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ) : isGuest ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => openModal("login")}
                  className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => openModal("join")}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-semibold",
                    isHeaderSticky
                      ? "border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                      : "border-white hover:bg-white hover:text-pink-600",
                  )}
                >
                  Sign Up
                </Button>
                <Link
                  href="/cart"
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    headerIconColor,
                  )}
                >
                  <CartIcon />
                </Link>
              </div>
            ) : (
              <nav className="flex items-center space-x-1">
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    "hidden font-semibold sm:inline-flex",
                    isHeaderSticky
                      ? "bg-linear-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  <Link href="/trending">
                    <Flame className="mr-2 h-5 w-5" />
                    Trending
                  </Link>
                </Button>
                <Link
                  href="/inbox"
                  className={cn(
                    "relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors md:flex",
                    headerIconColor,
                  )}
                >
                  <Mail className="h-6 w-6" />
                  {(unreadConvoCount ?? 0) > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-pink-600 ring-1 ring-white" />
                  )}
                </Link>
                <NotificationDropdown
                  className={cn("hidden md:flex", headerIconColor)}
                />
                <Link
                  href="/cart"
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    headerIconColor,
                  )}
                >
                  <CartIcon />
                </Link>
                {/* Profile Dropdown */}
                <div className="relative ml-2" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-pink-400"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-pink-100">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName ?? "Profile"}
                          className="h-full w-full object-cover"
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-pink-600">
                          {displayName?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </nav>
            )}
          </div>
        </header>

        {/* Banner Image */}
        <div
          ref={bannerRef}
          className="relative h-48 w-full bg-gray-100 lg:h-64"
        >
          <Image
            src={
              event.coverImage ??
              "https://images.unsplash.com/photo-1505238680356-667803448bb6?q=80&w=2070&auto=format&fit=crop"
            }
            alt="Banner"
            className="h-full w-full object-cover"
            fill
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-50 via-gray-50/50 to-black/30"></div>
        </div>

        <div className="relative container mx-auto max-w-4xl px-4">
          {/* Avatar & Actions */}
          <div className="-mt-24 flex flex-col items-center justify-center sm:-mt-28">
            <Image
              src={
                event.client.avatarUrl ??
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop"
              }
              alt={event.client.name ?? "Client"}
              className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 object-cover sm:h-40 sm:w-40"
              width={160}
              height={160}
            />
            <div className="mt-4 text-center">
              <h1 className="text-2xl font-bold">{event.client.name}</h1>
              <p className="text-sm text-gray-500">
                @{event.client.user.username}
              </p>
            </div>
            <div className="mt-4 flex items-center space-x-2 pb-4">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Floating Components from Header.tsx --- */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        openModal={openModal}
        user={user}
        signOut={signOut}
      />
      {isModalOpen && (
        <Modal onClose={closeModal}>
          <LoginJoinComponent
            isModal={true}
            initialView={modalView}
            onClose={closeModal}
          />
        </Modal>
      )}
    </>
  );
};

export default NewWishlistHeader;
