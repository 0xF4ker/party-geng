"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  Bell,
  Mail,
  ShoppingBag,
  Calendar,
  Settings,
  LogOut,
  Eye,
} from "lucide-react";
import LoginJoinComponent from "../LoginJoinComponent";
import CategoryCarousel from "./CategoryCarousel";
import SearchInput from "./SearchInput";
import {
  // allCategories,
  allCategoriesAndServices,
} from "@/app/local/categoryv2"; // Import new data
import MobileMenu from "./MobileMenu";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

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

  // --- Search State ---
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // --- Modal Handlers ---
  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when modal opens
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // --- Search Handlers ---
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

  // Close search when mobile menu opens
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeSearch();
    }
  }, [isMobileMenuOpen, closeSearch]);

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

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-40 w-full bg-white text-gray-800",
          // Add shadow only if search is not focused, to prevent weird layering
          !isSearchFocused && "shadow-md",
        )}
      >
        <div
          className={cn(
            "relative container mx-auto flex flex-col px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
            isSearchFocused && "z-50", // Elevate header content
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
            {!isVendor && (
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
            )}

            {/* Right Side: Nav Links */}
            {loading ? (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
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
                <nav className="hidden items-center space-x-6 lg:flex">
                  <Link
                    href="/v/dashboard"
                    className="font-medium hover:text-pink-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage_orders"
                    className="font-medium hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/earnings"
                    className="font-medium hover:text-pink-500"
                  >
                    Earnings
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
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
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/c/${user.id}`}
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

                {/* Mobile Profile Icon */}
                <div className="relative lg:hidden" ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="h-10 w-10 overflow-hidden rounded-full bg-pink-100 hover:ring-2 hover:ring-pink-500"
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
                  </button>

                  {/* Mobile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                      <Link
                        href={`/c/${user.id}`}
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
              </>
            ) : (
              // Client Navigation
              <>
                <nav className="hidden items-center space-x-4 lg:flex">
                  <Link href="/c/manage_events">
                    <button className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700">
                      <Calendar className="h-4 w-4" />
                      Plan Event
                    </button>
                  </Link>
                  <Link href="/inbox" className="relative">
                    <Mail className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                  </Link>
                  <Link href="/notifications" className="relative">
                    <Bell className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                  </Link>
                  <Link href="/manage_orders">
                    <ShoppingBag className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
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
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/c/${user.id}`}
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

                {/* Mobile Profile Icon + Icons */}
                <div className="flex items-center space-x-3 lg:hidden">
                  <Link href="/c/manage_events">
                    <Calendar className="h-6 w-6 text-gray-600 hover:text-pink-500" />
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className="h-10 w-10 overflow-hidden rounded-full bg-pink-100 hover:ring-2 hover:ring-pink-500"
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
                    </button>

                    {/* Mobile Dropdown */}
                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/c/${user.id}`}
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
                </div>
              </>
            )}
          </div>

          {/* === Bottom Row: Search Bar (Mobile < sm) - Only for guests and clients === */}
          {!isVendor && (
            <div className="mt-3 w-full sm:hidden">
              <SearchInput
                placeholder="Find services"
                isFocused={isSearchFocused}
                setIsFocused={setIsSearchFocused}
                query={searchQuery}
                setQuery={handleSearchChange}
                results={searchResults}
                onClear={clearSearch}
              />
            </div>
          )}
        </div>

        {/* Full-width Border */}
        <div className="w-full border-b border-gray-200"></div>

        {/* --- Category Carousel (Now part of the header) - Only for guests and clients --- */}
        {/* It will be hidden on mobile (<sm) by its own classes */}
        {!isVendor && (
          <div className="w-full">
            <CategoryCarousel />
          </div>
        )}
      </header>

      {/* --- Search Overlay --- */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={closeSearch}
        ></div>
      )}

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
