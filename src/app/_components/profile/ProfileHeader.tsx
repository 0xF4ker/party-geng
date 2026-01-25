"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  MessageSquare,
  Loader2,
  MoreHorizontal,
  Briefcase,
  History,
  Award,
  Menu,
  Calendar,
  Settings,
  Wallet,
  Grid3x3,
  Flame,
  Flag,
  ChevronDown, // Added
  LogOut, // Added
  User as UserIcon, // Added (Aliased to avoid conflict with User type)
} from "lucide-react";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReportModal } from "@/app/_components/modals/ReportModal";

type routerOutput = inferRouterOutputs<AppRouter>;
type User = routerOutput["user"]["getByUsername"];
type ClientProfile = User["clientProfile"];

// Modal from Header.tsx (Internal helper)
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

// --- Main Component ---
const ProfileHeader = ({
  clientProfile,
  profileUser,
  isOwnProfile,
  activeTab,
  setActiveTab,
}: {
  clientProfile: ClientProfile;
  profileUser: User;
  isOwnProfile: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // States from Header logic
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // States for Profile Header UI
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); // Reporting State

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

  // --- Logic for Real Stats ---
  const completedHires = profileUser.clientOrders?.length ?? 0;
  const eventsHosted = profileUser.clientProfile?._count?.events ?? 0;

  // --- Conversation Mutation ---
  const sendMessage = api.chat.sendMessage.useMutation();
  const createConversation = api.chat.getOrCreateConversation.useMutation({
    onSuccess: (data) => {
      sendMessage.mutate({
        conversationId: data.id,
        text: `Hi, I'd like to connect!`,
      });
      router.push(`/inbox?conversation=${data.id}`);
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create conversation. Please try again.");
      if (!user) {
        openModal("login");
      }
    },
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

  // --- Handlers ---
  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleContactClient = () => {
    if (!user) {
      toast.info("Please sign in to message this user.");
      openModal("login");
      return;
    }
    if (!profileUser?.id) {
      toast.error("Unable to message this user.");
      return;
    }
    if (user.id === profileUser.id) {
      toast.error("You cannot message yourself.");
      return;
    }

    createConversation.mutate({
      otherUserId: profileUser.id,
    });
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // --- Scroll Effects ---
  useEffect(() => {
    const HEADER_STICKY_HEIGHT = 64;

    const handleScroll = () => {
      const bannerBottom =
        bannerRef.current?.getBoundingClientRect().bottom ?? 0;
      if (window.scrollY > bannerBottom) {
        setIsHeaderSticky(true);
      } else if (window.scrollY > 50) {
        setIsHeaderSticky(true);
      } else {
        setIsHeaderSticky(false);
      }

      if (tabsRef.current) {
        const { top } = tabsRef.current.getBoundingClientRect();
        setIsTabsSticky(top <= HEADER_STICKY_HEIGHT);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Click Outside for Dropdown ---
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
        {/* --- Header Bar --- */}
        <header
          className={cn(
            "fixed top-0 right-0 left-0 z-40 w-full transition-all duration-300",
            isHeaderSticky ? "bg-white shadow-md" : "bg-transparent",
            headerTextColor,
          )}
        >
          <div className="relative container mx-auto flex h-16 items-center justify-between px-4">
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

            <div className="mx-4 hidden grow sm:flex lg:mx-16">
              {searchList && (
                <GlobalSearch
                  items={searchList}
                  className="w-full max-w-lg transition-all"
                />
              )}
            </div>

            {/* Nav Items */}
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
                  <EnvelopeIcon className="h-6 w-6" />
                  {(unreadConvoCount ?? 0) > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-pink-600 ring-1 ring-white" />
                  )}
                </Link>
                <NotificationDropdown
                  className={cn("hidden md:flex", headerIconColor)}
                />

                {/* --- Profile Dropdown Section --- */}
                <div
                  className="relative ml-2 flex items-center gap-1"
                  ref={profileDropdownRef}
                >
                  {/* Avatar Link */}
                  <Link
                    href={
                      isVendor ? `/v/${user?.username}` : `/c/${user?.username}`
                    }
                    className="block rounded-full ring-2 ring-transparent transition-all hover:ring-pink-500 focus:outline-none"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-100 bg-pink-100 shadow-sm">
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

                  {/* Caret Trigger */}
                  <button
                    onClick={toggleProfileDropdown}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none",
                      isHeaderSticky
                        ? "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                      isProfileDropdownOpen &&
                        isHeaderSticky &&
                        "bg-gray-100 text-gray-900 ring-2 ring-gray-200",
                      isProfileDropdownOpen &&
                        !isHeaderSticky &&
                        "bg-white/20 text-white",
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          @{user?.username}
                        </p>
                      </div>

                      <div className="p-1">
                        {/* <Link
                          href={
                            isVendor
                              ? `/v/${user?.username}`
                              : `/c/${user?.username}`
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <UserIcon className="h-4 w-4" /> Profile
                        </Link> */}

                        <Link
                          href="/settings"
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 p-1">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            void signOut();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" /> Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            )}
          </div>
        </header>

        {/* --- Banner Image --- */}
        <div
          ref={bannerRef}
          className="relative h-48 w-full bg-gray-100 lg:h-64"
        >
          <Image
            src={clientProfile?.bannerUrl ?? "/banner.jpg"}
            alt="Banner"
            className="h-full w-full object-cover"
            layout="fill"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-white via-white/50 to-black/30"></div>
        </div>

        {/* --- Profile Content --- */}
        <div className="relative container mx-auto max-w-4xl px-4">
          <div className="-mt-24 flex items-end justify-between sm:-mt-28">
            {/* Avatar */}
            {clientProfile?.avatarUrl ? (
              <Image
                src={clientProfile.avatarUrl}
                alt={clientProfile?.name ?? "Client"}
                className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 object-cover sm:h-40 sm:w-40"
                width={160}
                height={160}
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-pink-100 text-4xl font-bold text-pink-600 sm:h-40 sm:w-40">
                {clientProfile?.name?.charAt(0).toUpperCase() ?? "C"}
              </div>
            )}

            {/* Actions (Message / Edit / Report) */}
            <div className="flex items-center space-x-2 pb-4">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/wallet"
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
                <>
                  <button
                    onClick={handleContactClient}
                    disabled={createConversation.isPending}
                    className="flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createConversation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    Message
                  </button>

                  {/* Reporting Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="rounded-full border border-gray-300 bg-white p-2 text-gray-500 shadow-sm hover:bg-gray-100">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setIsReportOpen(true)}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Report User
                      </Button>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold">
              {clientProfile?.name ?? profileUser.username ?? "Client"}
            </h1>
            <p className="text-sm text-gray-500">@{profileUser.username}</p>
            {/* Removed Verified Client Badge */}
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
                <span>
                  {
                    (
                      clientProfile.location as unknown as {
                        display_name: string;
                      }
                    )?.display_name
                  }
                </span>
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

          {/* Real Stats */}
          <div className="mt-4 flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-bold text-gray-900">{eventsHosted}</span>
              <span className="text-gray-500"> Events Hosted</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">{completedHires}</span>
              <span className="text-gray-500"> Hires Made</span>
            </div>
          </div>
        </div>

        {/* --- Scrollable Tabs --- */}
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
            <nav
              className="scrollbar-hide -mb-px flex space-x-8 overflow-x-auto"
              aria-label="Tabs"
            >
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
                title="Gallery"
                icon={<Grid3x3 className="h-5 w-5" />}
                isActive={activeTab === "gallery"}
                onClick={() => setActiveTab("gallery")}
              />
              {/* <TabButton
                title="Reviews"
                icon={<Award className="h-5 w-5" />}
                isActive={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
              /> */}
            </nav>
          </div>
        </div>
      </div>

      {/* --- Floating Components --- */}
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

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetUserId={profileUser.id}
      />
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
      "flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors",
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
