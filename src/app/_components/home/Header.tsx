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
import { usePathname } from "next/navigation";

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
    const orig = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative h-full w-full sm:h-auto sm:w-auto" onClick={(e) => e.stopPropagation()}>
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
  const pathname = usePathname();

  // Is this the landing page (unauthenticated home)?
  const isLandingPage = pathname === "/" && !user;

  useEffect(() => {
    if (!headerRef.current) return;
    const ro = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    });
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, [setHeaderHeight]);

  const { data: unreadConvoCount } = api.chat.getUnreadConversationCount.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: searchList } = api.category.getSearchList.useQuery();

  const isVendor = user?.vendorProfile !== null && user?.vendorProfile !== undefined;
  const isGuest = !user;
  const avatarUrl = isVendor ? user?.vendorProfile?.avatarUrl : user?.clientProfile?.avatarUrl;
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  /* ── Style: dark frosted globally ── */
  const headerStyle: React.CSSProperties = {};

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 right-0 left-0 z-40 w-full",
          "l-glass-nav shadow-md",
        )}
        style={headerStyle}
      >
        <div className={cn(
          "relative container mx-auto flex flex-col px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        )}>
          <div className="flex w-full items-center justify-between">
            {/* LEFT: Menu & Logo */}
            <div className="flex shrink-0 items-center">
              <button
                onClick={toggleMobileMenu}
                className={cn("-ml-1 p-1 lg:hidden", isLandingPage ? "text-[var(--l-text-muted)] hover:text-[var(--l-text)]" : "")}
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="PartyGeng Logo"
                  width={150}
                  height={50}
                  className={cn(
                    "ml-3 h-6 w-auto object-contain sm:ml-4 drop-shadow-md",
                  )}
                />
              </Link>
            </div>

            {/* MIDDLE: Search */}
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
                  className={cn(
                    "hidden text-sm font-medium sm:block transition-colors",
                    "text-[var(--l-text-muted)] hover:text-[var(--l-text)]"
                  )}
                >
                  Sign in
                </button>
                <button
                  onClick={() => openModal("join")}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                    "border border-[rgba(247,37,133,0.6)] bg-[rgba(247,37,133,0.1)] text-[#f72585] hover:bg-[rgba(247,37,133,0.2)] hover:shadow-[0_0_14px_rgba(247,37,133,0.4)]"
                  )}
                  id="header-join-btn"
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
                    className="bg-gradient-to-r from-orange-400 to-pink-500 font-semibold text-white shadow-sm hover:from-orange-500 hover:to-pink-600"
                  >
                    <Link href="/trending">
                      <Flame className="mr-2 h-4 w-4" /> Trending
                    </Link>
                  </Button>
                  {isVendor ? (
                    <>
                      <Link href="/dashboard" className="text-sm font-medium text-[var(--l-text-muted)] hover:text-[var(--l-text)] transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/manage_orders" className="text-sm font-medium text-[var(--l-text-muted)] hover:text-[var(--l-text)] transition-colors">
                        Manage Orders
                      </Link>
                      <Link href="/wallet" className="text-sm font-medium text-[var(--l-text-muted)] hover:text-[var(--l-text)] transition-colors">
                        Wallet
                      </Link>
                    </>
                  ) : (
                    <Link href="/manage_orders" className="text-sm font-medium text-[var(--l-text-muted)] hover:text-[var(--l-text)] transition-colors">
                      Manage Orders
                    </Link>
                  )}
                </nav>

                {/* Icons Area */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/inbox"
                    className="relative hidden h-10 w-10 items-center justify-center rounded-full text-[var(--l-text-muted)] transition-colors hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--l-text)] md:flex"
                  >
                    <EnvelopeIcon className="h-6 w-6" />
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--l-brand-pink)] ring-1 ring-[var(--l-bg)]" />
                    )}
                  </Link>
                  <NotificationDropdown className="flex text-[var(--l-text-muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--l-text)]" />
                </div>

                {/* Plan Event (Desktop Client Only) */}
                {!isVendor && (
                  <div className="ml-2 hidden items-center lg:flex">
                    <Link href="/manage_events">
                      <button className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(247,37,133,0.3)] transition-[transform,box-shadow] duration-200 hover:scale-105">
                        <Calendar className="h-4 w-4" /> Plan Event
                      </button>
                    </Link>
                  </div>
                )}

                {/* Profile & Dropdown */}
                <div className="relative flex items-center gap-1" ref={profileDropdownRef}>
                  <Link
                    href={isVendor ? `/v/${user?.username}` : `/c/${user?.username}`}
                    className="block rounded-full ring-2 ring-transparent transition-all hover:ring-[var(--l-brand-pink)] focus:outline-none"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--l-border)] bg-[rgba(247,37,133,0.1)] shadow-sm sm:h-10 sm:w-10">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={displayName ?? "Profile"} className="h-full w-full object-cover" width={40} height={40} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--l-brand-pink)] sm:text-base">
                          {displayName?.charAt(0).toUpperCase() ?? (isVendor ? "V" : "C")}
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={toggleProfileDropdown}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-[var(--l-text-muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--l-text)] focus:outline-none transition-colors",
                      isProfileDropdownOpen && "bg-[rgba(0,0,0,0.05)] text-[var(--l-text)] ring-2 ring-[var(--l-border)]",
                      "md:h-9 md:w-auto md:px-3 md:py-1.5"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[var(--l-border)] l-card shadow-[0_12px_48px_rgba(0,0,0,0.5)] focus:outline-none">
                      <div className="border-b border-[var(--l-border)] px-4 py-3">
                        <p className="truncate text-sm font-bold text-[var(--l-text)]">{displayName}</p>
                        <p className="truncate text-xs text-[var(--l-text-muted)]">@{user?.username}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/settings"
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-[var(--l-text)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                      </div>
                      <div className="border-t border-[var(--l-border)] p-1">
                        <button
                          onClick={() => { setIsProfileDropdownOpen(false); void signOut(); }}
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#ff4d4d] hover:bg-[rgba(255,77,77,0.1)] transition-colors"
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
                  <GlobalSearch items={searchList} className="w-full max-w-lg transition-all" />
                )}
              </div>
            )
          )}
        </div>

        {/* Carousel Divider */}
        <div className="w-full border-b border-[var(--l-border)]" />

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
          <LoginJoinComponent isModal={true} initialView={modalView} onClose={closeModal} />
        </Modal>
      )}
    </>
  );
};

export default Header;
