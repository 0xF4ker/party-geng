"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, Mail, Calendar, Settings, MoreHorizontal } from "lucide-react";
import LoginJoinComponent from "../LoginJoinComponent";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import CategoryCarousel from "./CategoryCarousel";
import GlobalSearch from "./GlobalSearch";
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { api } from "@/trpc/react";
import { useUiStore } from "@/stores/ui";

const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  // Handles clicking on the backdrop (outside the modal content) to close the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // e.currentTarget is the element we attached the listener to (the backdrop)
    // e.target is the element that was actually clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Effect to lock body scroll when modal is open
  useEffect(() => {
    // Get the original body overflow style
    const originalOverflow = window.getComputedStyle(document.body).overflow;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <div
      // Full-screen overlay
      // On mobile (default): aligns content to the top
      // On sm+ screens: centers content and adds padding
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        // This relative container holds the modal content
        // On mobile (default): w-full and h-full to fill the screen
        // On sm+ screens: auto-sizes to fit the content
        className="relative h-full w-full sm:h-auto sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { setHeaderHeight } = useUiStore();

  useEffect(() => {
    if (!headerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    });
    resizeObserver.observe(headerRef.current);
    return () => resizeObserver.disconnect();
  }, [setHeaderHeight]);

  // Fetch wallet balance
  api.payment.getWallet.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: unreadConvoCount } =
    api.chat.getUnreadConversationCount.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: searchList } = api.category.getSearchList.useQuery();

  // Determine user type
  const isVendor =
    user?.vendorProfile !== null && user?.vendorProfile !== undefined;
  // const isClient = user?.clientProfile !== null && user?.clientProfile !== undefined;
  const isGuest = !user;

  // Get avatar and name from appropriate profile
  const avatarUrl = isVendor
    ? user?.vendorProfile?.avatarUrl
    : user?.clientProfile?.avatarUrl;
  const displayName = isVendor
    ? (user?.vendorProfile?.companyName ?? user?.username)
    : (user?.clientProfile?.name ?? user?.username);

  // --- Modal Handlers ---
  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when modal opens
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close dropdown on outside click
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

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 right-0 left-0 z-40 w-full bg-white text-gray-800",
          "shadow-md",
        )}
      >
        <div
          className={cn(
            "relative container mx-auto flex flex-col px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          {/* === Top Row: Logo, Hamburger, Mobile Nav === */}
          <div className="flex w-full items-center justify-between">
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
                  className="ml-4 h-6 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Middle: Search Bar (sm to lg) - Only for guests and clients */}
            {loading ? (
              <div className="mx-4 hidden grow sm:flex lg:mx-16">
                <Skeleton className="h-10 w-full max-w-lg" />
              </div>
            ) : (
              !isVendor && (
                <div className="mx-4 hidden grow sm:flex lg:mx-16">
                  {searchList && (
                    <GlobalSearch
                      items={searchList}
                      className="w-full max-w-lg transition-all"
                    />
                  )}
                </div>
              )
            )}

            {/* Right Side: Nav Links */}
            {loading ? (
              <>
                {/* Desktop Skeleton */}
                <div className="hidden items-center space-x-6 lg:flex">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                {/* Mobile Skeleton */}
                <div className="flex items-center lg:hidden">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </>
            ) : isGuest ? (
              // Guest Navigation
              <>
                {/* Nav (Mobile/Tablet < lg) */}
                <nav className="flex items-center space-x-2 lg:hidden">
                  <button
                    onClick={() => openModal("login")}
                    className="hidden text-sm font-medium hover:text-pink-500 sm:block"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => openModal("join")}
                    className="rounded-md border border-pink-500 px-3 py-1.5 text-sm font-semibold text-pink-500 hover:bg-pink-500 hover:text-white"
                  >
                    Join
                  </button>
                </nav>

                {/* Nav (Desktop >= lg) */}
                <nav className="hidden items-center space-x-4 lg:flex">
                  <a href="/pro" className="font-medium hover:text-pink-500">
                    Partygeng Pro
                  </a>
                  <a
                    href="/start_selling"
                    className="font-medium hover:text-pink-500"
                  >
                    Become a Vendor
                  </a>
                  <button
                    onClick={() => openModal("login")}
                    className="font-medium hover:text-pink-500"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => openModal("join")}
                    className="rounded-md border border-pink-500 px-4 py-2 font-semibold text-pink-500 hover:bg-pink-500 hover:text-white"
                  >
                    Join
                  </button>
                </nav>
              </>
            ) : isVendor ? (
              // Vendor Navigation
              <>
                <nav className="hidden items-center space-x-4 lg:flex">
                  <Link
                    href="/dashboard"
                    className="font-medium text-gray-700 hover:text-pink-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage_orders"
                    className="font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/earnings"
                    className="font-medium text-gray-700 hover:text-pink-500"
                  >
                    Earnings
                  </Link>
                  <Link href="/inbox" className="relative">
                    <Mail className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                        {unreadConvoCount}
                      </span>
                    )}
                  </Link>
                  <NotificationDropdown className="text-gray-600 hover:text-pink-500" />

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          isVendor
                            ? `/v/${user?.username}`
                            : `/c/${user?.username}`
                        }
                        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-pink-500"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-pink-100">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName ?? "Profile"}
                              className="h-full w-full object-cover"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-pink-600">
                              {displayName?.charAt(0).toUpperCase() ?? "V"}
                            </div>
                          )}
                        </div>
                      </Link>
                      {/* <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-600" />
                      </button> */}
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user?.username}
                          </p>
                        </div>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>

                {/* Mobile Profile Icon */}
                <div className="flex-shrink-0 lg:hidden">
                  <Link
                    href={
                      isVendor ? `/v/${user?.username}` : `/c/${user?.username}`
                    }
                    className="block h-10 w-10 overflow-hidden rounded-full bg-pink-100 hover:ring-2 hover:ring-pink-500"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName ?? "Profile"}
                        className="h-full w-full object-cover"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-semibold text-pink-600">
                        {displayName?.charAt(0).toUpperCase() ?? "V"}
                      </div>
                    )}
                  </Link>
                </div>
              </>
            ) : (
              // Client Navigation
              <>
                <nav className="hidden items-center space-x-4 lg:flex">
                  <Link
                    href="/manage_orders"
                    className="font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link href="/inbox" className="relative">
                    <Mail className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                        {unreadConvoCount}
                      </span>
                    )}
                  </Link>
                  <NotificationDropdown className="text-gray-600 hover:text-pink-500" />
                  <Link href="/manage_events">
                    <button className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700">
                      <Calendar className="h-4 w-4" />
                      Plan Event
                    </button>
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          isVendor
                            ? `/v/${user?.username}`
                            : `/c/${user?.username}`
                        }
                        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-pink-500"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-pink-100">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName ?? "Profile"}
                              className="h-full w-full object-cover"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-pink-600">
                              {displayName?.charAt(0).toUpperCase() ?? "C"}
                            </div>
                          )}
                        </div>
                      </Link>
                      {/* <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-600" />
                      </button> */}
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user?.username}
                          </p>
                        </div>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>

                {/* Mobile Profile Icon */}
                <div className="flex-shrink-0 lg:hidden">
                  <Link
                    href={
                      isVendor ? `/v/${user?.username}` : `/c/${user?.username}`
                    }
                    className="block h-10 w-10 overflow-hidden rounded-full bg-pink-100 hover:ring-2 hover:ring-pink-500"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName ?? "Profile"}
                        className="h-full w-full object-cover"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-semibold text-pink-600">
                        {displayName?.charAt(0).toUpperCase() ?? "C"}
                      </div>
                    )}
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* === Bottom Row: Search Bar (Mobile < sm) - Only for guests and clients === */}
          {loading ? (
            <div className="mt-3 w-full sm:hidden">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            !isVendor && (
              <div className="mt-3 w-full sm:hidden">
                {searchList && (
                  <GlobalSearch
                    items={searchList}
                    className="w-full max-w-lg transition-all"
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* Full-width Border */}
        <div className="w-full border-b border-gray-200"></div>

        {/* --- Category Carousel (Now part of the header) - Only for guests and clients --- */}
        {/* It will be hidden on mobile (<sm) by its own classes */}
        {loading ? (
          <div className="hidden w-full sm:block">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          !isVendor && (
            <div className="w-full">
              <CategoryCarousel />
            </div>
          )
        )}
      </header>

      {/* --- Mobile Menu Flyout --- */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        openModal={openModal}
        user={user}
        signOut={signOut}
      />

      {/* --- Modal --- */}
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

export default Header;
