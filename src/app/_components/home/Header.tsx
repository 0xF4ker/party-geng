"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  Calendar,
  Flame,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
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
import { Button } from "@/components/ui/button";

const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
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

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");

  // Controls the dropdown menu next to profile
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

  const { data: unreadConvoCount } =
    api.chat.getUnreadConversationCount.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: searchList } = api.category.getSearchList.useQuery();

  const isVendor =
    user?.vendorProfile !== null && user?.vendorProfile !== undefined;
  const isGuest = !user;

  const avatarUrl = isVendor
    ? user?.vendorProfile?.avatarUrl
    : user?.clientProfile?.avatarUrl;
  const displayName = isVendor
    ? (user?.vendorProfile?.companyName ?? user?.username)
    : (user?.clientProfile?.name ?? user?.username);

  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false);
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 right-0 left-0 z-40 w-full bg-white text-gray-800 shadow-md",
        )}
      >
        <div
          className={cn(
            "relative container mx-auto flex flex-col px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex w-full items-center justify-between">
            {/* LEFT: Menu & Logo */}
            <div className="flex shrink-0 items-center">
              <button
                onClick={toggleMobileMenu}
                className="-ml-1 p-1 lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="PartyGeng Logo"
                  width={150}
                  height={50}
                  className="ml-3 h-6 w-auto object-contain sm:ml-4"
                />
              </Link>
            </div>

            {/* MIDDLE: Search (Hidden on Mobile) */}
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

            {/* RIGHT: Actions */}
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ) : isGuest ? (
              <nav className="flex items-center gap-3">
                <button
                  onClick={() => openModal("login")}
                  className="hidden text-sm font-medium hover:text-pink-500 sm:block"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openModal("join")}
                  className="rounded-md border border-pink-500 px-4 py-1.5 text-sm font-semibold text-pink-500 transition-colors hover:bg-pink-500 hover:text-white"
                >
                  Join
                </button>
              </nav>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Desktop Nav Links */}
                <nav className="hidden items-center gap-6 lg:flex">
                  <Button
                    asChild
                    size="sm"
                    className="bg-linear-to-r from-orange-400 to-pink-500 font-semibold text-white shadow-sm hover:from-orange-500 hover:to-pink-600"
                  >
                    <Link href="/trending">
                      <Flame className="mr-2 h-4 w-4" /> Trending
                    </Link>
                  </Button>
                  {isVendor ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-sm font-medium text-gray-700 hover:text-pink-500"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/manage_orders"
                        className="text-sm font-medium text-gray-700 hover:text-pink-500"
                      >
                        Orders
                      </Link>
                      <Link
                        href="/wallet"
                        className="text-sm font-medium text-gray-700 hover:text-pink-500"
                      >
                        Wallet
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/manage_orders"
                      className="text-sm font-medium text-gray-700 hover:text-pink-500"
                    >
                      Orders
                    </Link>
                  )}
                </nav>

                {/* Icons Area */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Desktop Inbox */}
                  <Link
                    href="/inbox"
                    className="relative hidden h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-pink-600 md:flex"
                  >
                    <EnvelopeIcon className="h-6 w-6" />
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-pink-600 ring-1 ring-white" />
                    )}
                  </Link>

                  {/* NOTIFICATION BELL */}
                  <NotificationDropdown className="flex text-gray-600 hover:bg-gray-100 hover:text-pink-600" />
                </div>

                {/* Plan Event (Desktop Client Only) */}
                {!isVendor && (
                  <div className="ml-2 hidden items-center lg:flex">
                    <Link href="/manage_events">
                      <button className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-700">
                        <Calendar className="h-4 w-4" /> Plan Event
                      </button>
                    </Link>
                  </div>
                )}

                {/* Profile Picture & Dropdown */}
                <div
                  className="relative flex items-center gap-1"
                  ref={profileDropdownRef}
                >
                  {/* Avatar Link */}
                  <Link
                    href={
                      isVendor ? `/v/${user?.username}` : `/c/${user?.username}`
                    }
                    className="block rounded-full ring-2 ring-transparent transition-all hover:ring-pink-500 focus:outline-none"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-100 bg-pink-100 shadow-sm sm:h-10 sm:w-10">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName ?? "Profile"}
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-pink-600 sm:text-base">
                          {displayName?.charAt(0).toUpperCase() ??
                            (isVendor ? "V" : "C")}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Caret Dropdown Trigger */}
                  <button
                    onClick={toggleProfileDropdown}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none",
                      isProfileDropdownOpen &&
                        "bg-gray-100 text-gray-900 ring-2 ring-gray-200",
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
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
                          <User className="h-4 w-4" /> Profile
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
              </div>
            )}
          </div>

          {/* Mobile Search Bar (Client Only) */}
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

        {/* Carousel Divider */}
        <div className="w-full border-b border-gray-200"></div>

        {/* Categories (Desktop Client Only) */}
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

export default Header;
