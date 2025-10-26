"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import LoginJoinComponent from "../LoginJoinComponent";
import CategoryCarousel from "./CategoryCarousel";
import SearchInput from "./SearchInput";
import {
  // allCategories,
  allCategoriesAndServices,
} from "@/app/local/categoryv2"; // Import new data
import MobileMenu from "./MobileMenu";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");

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
      const filtered = allCategoriesAndServices.filter((cat) =>
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
            <div className="flex flex-shrink-0 items-center">
              <button onClick={toggleMobileMenu} className="lg:hidden">
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/">
                <h1
                  className={cn(
                    "brand-text-gradient ml-4 text-3xl font-bold", // Always gradient
                  )}
                >
                  Partygeng
                </h1>
              </Link>
            </div>

            {/* Middle: Search Bar (sm to lg) */}
            <div className="mx-4 hidden flex-grow sm:flex lg:mx-16">
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
          </div>

          {/* === Bottom Row: Search Bar (Mobile < sm) === */}
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
        </div>

        {/* Full-width Border */}
        <div className="w-full border-b border-gray-200"></div>

        {/* --- Category Carousel (Now part of the header) --- */}
        {/* It will be hidden on mobile (<sm) by its own classes */}
        <div className="w-full">
          <CategoryCarousel />
        </div>
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
