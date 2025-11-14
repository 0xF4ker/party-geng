"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Check,
  MapPin,
  MessageSquare,
  Gift,
  Loader2,
  Edit,
  MoreHorizontal,
  Briefcase,
  History,
  Award,
  Menu,
  Bell,
  Mail,
  ShoppingBag,
  Calendar,
  Settings,
  LogOut,
  Eye,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Skeleton } from "@/components/ui/skeleton";
import LoginJoinComponent from "../LoginJoinComponent";
import SearchInput from "../home/SearchInput";
import { allCategoriesAndServices } from "@/app/local/categoryv2";
import MobileMenu from "../home/MobileMenu";

type routerOutput = inferRouterOutputs<AppRouter>;
type user = routerOutput["user"]["getByUsername"];
type clientProfile = user["clientProfile"];

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
const ProfileHeader = ({
  clientProfile,
  profileUser,
  isOwnProfile,
  activeTab,
  setActiveTab,
}: {
  clientProfile: clientProfile;
  profileUser: user;
  isOwnProfile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // States from Header.tsx
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = allCategoriesAndServices.filter(
        (cat) =>
          typeof cat === "string" &&
          cat.toLowerCase().includes(query.toLowerCase()),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);
  const closeSearch = useCallback(() => {
    setIsSearchFocused(false);
    clearSearch();
  }, [clearSearch]);

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
    if (isMobileMenuOpen) closeSearch();
  }, [isMobileMenuOpen, closeSearch]);

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
              <SearchInput
                placeholder="Find services"
                className="w-full max-w-lg transition-all"
                isFocused={isSearchFocused}
                setIsFocused={setIsSearchFocused}
                query={searchQuery}
                setQuery={handleSearchChange}
                results={searchResults}
                onClear={clearSearch}
              />
            </div>

            {/* Right Side: Nav Links */}
            {loading ? (
              <div className="flex items-center space-x-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ) : isGuest ? (
              <div className="flex items-center gap-2">
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
              <nav className="flex items-center space-x-4">
                <Link href="/inbox" className="relative">
                  <Mail className={cn("h-6 w-6", headerIconColor)} />
                </Link>
                <Link href="/notifications" className="relative">
                  <Bell className={cn("h-6 w-6", headerIconColor)} />
                </Link>
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
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
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 text-gray-900 shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user?.username}
                        </p>
                      </div>
                      <Link
                        href="/earnings"
                        className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Wallet
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          ₦{wallet?.availableBalance.toLocaleString() ?? "0"}
                        </span>
                      </Link>
                      <Link
                        href={
                          isVendor
                            ? `/v/${user.username}`
                            : `/c/${user.username}`
                        }
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View Public Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          void signOut();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
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
              clientProfile?.bannerUrl ??
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
          <div className="-mt-24 flex items-end justify-between sm:-mt-28">
            <Image
              src={
                clientProfile?.avatarUrl ??
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop"
              }
              alt={clientProfile?.name ?? "Client"}
              className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 object-cover sm:h-40 sm:w-40"
              width={160}
              height={160}
            />
            <div className="flex items-center space-x-2 pb-4">
              {isOwnProfile ? (
                <button
                  onClick={() => router.push("/settings")}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-md transition-colors hover:bg-gray-200"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700">
                    Message
                  </button>
                  <button className="rounded-full border border-gray-300 bg-white p-2 text-gray-500 shadow-sm hover:bg-gray-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Info, Bio, etc. */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold">
              {clientProfile?.name ?? profileUser.username ?? "Client"}
            </h1>
            <p className="text-sm text-gray-500">@{profileUser.username}</p>
            <div className="mt-1 flex items-center gap-2">
              <Check className="h-5 w-5 rounded-full bg-green-500 p-0.5 text-white" />
              <span className="text-sm font-semibold text-green-600">
                Verified Client
              </span>
            </div>
          </div>
          <div className="mt-4 max-w-2xl text-sm text-gray-800">
            <p>
              {clientProfile?.bio ??
                "Event enthusiast and planner. Creating memorable experiences since 2020. Let's connect and make magic happen!"}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            {clientProfile?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{clientProfile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Joined{" "}
                {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-bold text-gray-900">0</span>
              <span className="text-gray-500"> Events Hosted</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">0</span>
              <span className="text-gray-500"> Hires Made</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className={cn(
            "z-10 mt-6 border-b border-gray-200 bg-white/80 transition-shadow",
            isTabsSticky
              ? "sticky top-[64px] shadow-md backdrop-blur-sm"
              : "relative",
          )}
        >
          <div className="container mx-auto max-w-4xl px-4">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
                <option value="reviews">Reviews</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <TabButton
                  title="Upcoming Events"
                  icon={<Briefcase className="h-5 w-5" />}
                  isActive={activeTab === "upcoming"}
                  onClick={() => setActiveTab("upcoming")}
                />
                <TabButton
                  title="Past Events"
                  icon={<History className="h-5 w-5" />}
                  isActive={activeTab === "past"}
                  onClick={() => setActiveTab("past")}
                />
                <TabButton
                  title="Reviews"
                  icon={<Award className="h-5 w-5" />}
                  isActive={activeTab === "reviews"}
                  onClick={() => setActiveTab("reviews")}
                />
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* --- Floating Components from Header.tsx --- */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={closeSearch}
        ></div>
      )}
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

const TabButton = ({
  title,
  icon,
  isActive,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {icon}
    {title}
  </button>
);

export default ProfileHeader;
