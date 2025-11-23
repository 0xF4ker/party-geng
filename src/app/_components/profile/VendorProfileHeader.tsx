"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  MessageSquare,
  Loader2,
  Menu,
  Mail,
  Settings,
  Wallet,
  Award,
  Flame,
} from "lucide-react";
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

type routerOutput = inferRouterOutputs<AppRouter>;
type vendorProfileWithUser = routerOutput["vendor"]["getByUsername"];
type reviews = routerOutput["review"]["getForVendor"];

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
const VendorProfileHeader = ({
  vendorProfile,
  isOwnProfile,
  activeTab,
  setActiveTab,
  reviews,
}: {
  vendorProfile: vendorProfileWithUser;
  isOwnProfile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviews: reviews | undefined;
}) => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // States from Header.tsx
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // States from ProfileHeader.tsx
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  const { data: wallet } = api.payment.getWallet.useQuery(undefined, {
    enabled: !!user,
  });
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

  const createConversation = api.chat.createConversationWithMessage.useMutation(
    {
      onSuccess: (data) => {
        router.push(`/inbox?conversation=${data.conversationId}`);
      },
      onError: (error) => {
        console.error("Failed to create conversation:", error);
        // You might want to show a toast notification here
        // alert("Failed to create conversation. Please try again.");
        toast.error("Failed to create conversation. Please try again.");
      },
    },
  );

  const handleContactVendor = () => {
    if (!user) {
      toast.info("Please sign in to contact this vendor");
      openModal("login");
      return;
    }
    if (!vendorProfile?.userId) {
      toast.error("Unable to contact this vendor");
      return;
    }
    if (user.id === vendorProfile.userId) {
      toast.error("You cannot message yourself");
      return;
    }

    createConversation.mutate({
      otherUserId: vendorProfile.userId,
      initialMessage: `Hi! I'd like to know more about your services.`,
    });
  };

  // --- Scroll Effects ---
  useEffect(() => {
    const HEADER_STICKY_HEIGHT = 64; // Height of the sticky header

    const handleScroll = () => {
      // Header stickiness
      const bannerBottom =
        bannerRef.current?.getBoundingClientRect().bottom ?? 0;
      if (window.scrollY > bannerBottom) {
        setIsHeaderSticky(true);
      } else if (window.scrollY > 50) {
        setIsHeaderSticky(true);
      } else {
        setIsHeaderSticky(false);
      }

      // Tabs stickiness
      if (tabsRef.current) {
        const { top } = tabsRef.current.getBoundingClientRect();
        setIsTabsSticky(top <= HEADER_STICKY_HEIGHT);
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

  const tabs = ["gallery", "reviews"];

  return (
    <>
      <div ref={headerRef} className="relative bg-white pb-4">
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
                  asChild
                  size="sm"
                  className={cn(
                    "font-semibold",
                    isHeaderSticky
                      ? "bg-linear-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  <Link href="/trending">
                    <Flame className="mr-1 h-5 w-5" />
                    Trending
                  </Link>
                </Button>
                <button
                  onClick={() => openModal("login")}
                  className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openModal("join")}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-semibold",
                    isHeaderSticky
                      ? "border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                      : "border-white hover:bg-white hover:text-pink-600",
                  )}
                >
                  Join
                </button>
              </div>
            ) : (
              <nav className="flex items-center space-x-2">
                  <Button asChild size="sm" className={cn(
                    "font-semibold hidden sm:inline-flex",
                    isHeaderSticky
                      ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}>
                    <Link href="/trending">
                      <Flame className="mr-2 h-5 w-5" />
                      Trending
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" className={cn("relative hidden sm:flex", headerIconColor)}>
                    <Link href="/inbox">
                      <Mail className="h-6 w-6" />
                      {(unreadConvoCount ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                          {unreadConvoCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <NotificationDropdown className={headerIconColor} />
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <Link
                    href={
                      isVendor ? `/v/${user?.username}` : `/c/${user?.username}`
                    }
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
                  </Link>
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
              vendorProfile?.bannerUrl ??
              "https://images.unsplash.com/photo-1505238680356-667803448bb6?q=80&w=2070&auto=format&fit=crop"
            }
            alt="Banner"
            className="h-full w-full object-cover"
            layout="fill"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-white via-white/50 to-black/30"></div>
        </div>

        <div className="relative container mx-auto max-w-4xl px-4">
          {/* Avatar & Actions */}
          <div className="-mt-24 flex flex-col items-center sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center sm:flex-row sm:items-end">
              <Image
                src={
                  vendorProfile?.avatarUrl ??
                  "https://placehold.co/160x160/d1d5db/ffffff?text=V"
                }
                alt={vendorProfile?.companyName ?? "Vendor"}
                className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 object-cover sm:h-40 sm:w-40"
                width={160}
                height={160}
              />
              <div className="mt-4 text-center sm:ml-6 sm:text-left">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {vendorProfile?.companyName ?? "New Vendor"}
                </h1>
                <p className="text-md text-gray-500 sm:text-lg">
                  {vendorProfile?.title}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2 sm:mt-0">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/earnings"
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-md transition-colors hover:bg-gray-100"
                  >
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span>
                      ₦{wallet?.availableBalance.toLocaleString() ?? "0"}
                    </span>
                  </Link>
                  <button
                    onClick={() => router.push("/settings")}
                    className="rounded-full border border-gray-300 bg-white p-2.5 text-gray-500 shadow-sm hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleContactVendor}
                  disabled={createConversation.isPending}
                  className="flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createConversation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Request Quote
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{vendorProfile?.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4" />
                <span>
                  {vendorProfile?.rating?.toFixed(1) ?? "0.0"} (
                  {reviews?.length ?? 0} Reviews)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>{vendorProfile?.level ?? "Level 0"}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          {vendorProfile?.services && vendorProfile.services.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap gap-2">
                {vendorProfile.services.map(({ service }) => (
                  <span
                    key={service.id}
                    className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-700"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className={cn(
            "z-10 mt-6 border-b border-gray-200 bg-white/80 transition-shadow",
            isTabsSticky
              ? "sticky top-16 shadow-md backdrop-blur-sm"
              : "relative",
          )}
        >
          <div className="container mx-auto max-w-4xl px-4">
            <div className="hidden sm:block">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "border-b-2 px-1 py-4 text-sm font-medium capitalize",
                      activeTab === tab
                        ? "border-pink-600 text-pink-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
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

export default VendorProfileHeader;
