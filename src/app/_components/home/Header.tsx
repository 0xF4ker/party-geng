"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, Search, X } from "lucide-react";
import LoginJoinComponent from "../LoginJoinComponent";
import CategoryCarousel from "./CategoryCarousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import categories from "@/app/local/categories";

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
  // const [isScrolled, setIsScrolled] = useState(false); // No longer needed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");

  // useEffect(() => { // No longer needed
  //   const handleScroll = () => {
  //     if (window.scrollY > 10) {
  //       setIsScrolled(true);
  //     } else {
  //       setIsScrolled(false);
  //     }
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  // --- Modal Handlers ---
  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when modal opens
  };
  const closeModal = () => setIsModalOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-40 w-full bg-white text-gray-800 shadow-md",
        )}
      >
        <div className="relative container mx-auto flex flex-col px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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
              <div
                className={cn(
                  "flex w-full max-w-lg transition-all",
                  // Always visible
                )}
              >
                <input
                  type="text"
                  placeholder="Find services" // Simple placeholder for sm/md
                  className="w-full rounded-l-md border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none lg:hidden"
                />
                <input
                  type="text"
                  placeholder="What service are you looking for today?" // Detailed placeholder for lg+
                  className="hidden w-full rounded-l-md border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none lg:flex"
                />
                <button className="rounded-r-md bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600">
                  <Search className="h-5 w-5" />
                </button>
              </div>
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
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Find services"
                className="w-full rounded-l-md border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none"
              />
              <button className="rounded-r-md bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600">
                <Search className="h-5 w-5" />
              </button>
            </div>
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

      {/* --- Mobile Menu Flyout --- */}
      {/* This uses a transition for a smoother slide-in effect */}
      <div
        className={cn(
          "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={toggleMobileMenu}
        ></div>

        {/* Menu Content */}
        <div className="relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-4 shadow-xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-pink-500">Partygeng</h2>
            <button onClick={toggleMobileMenu}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex flex-col space-y-5">
            {/* Mobile menu needs its own Join/Sign in */}
            <button
              onClick={() => openModal("join")}
              className="w-full rounded-md bg-pink-500 px-4 py-2.5 text-lg font-bold text-white hover:bg-pink-600"
            >
              Join Partygeng
            </button>
            <button
              onClick={() => openModal("login")}
              className="text-left text-base font-medium text-gray-700 hover:text-pink-500"
            >
              Sign in
            </button>

            {/* --- Category Accordion --- */}
            <div className="">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="categories">
                  <AccordionTrigger className="text-lg">
                    Browse categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-5 flex flex-col space-y-3">
                      {categories.map((category) => (
                        <a
                          key={category}
                          href={`/categories/${category
                            .toLowerCase()
                            .replace(/ /g, "-")}`}
                          className="flex items-center justify-between text-gray-700 hover:text-pink-500"
                        >
                          {category}
                          <ChevronRight className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="space-y-5">
              <a
                href="/pro"
                className="block text-base font-medium text-gray-700 hover:text-pink-500"
              >
                Partygeng Pro
              </a>
              <a
                href="/start_selling"
                className="block text-base font-medium text-gray-700 hover:text-pink-500"
              >
                Become a Vendor
              </a>
              {/* Add other links like 'Explore' here if needed */}
            </div>
          </nav>
        </div>
      </div>

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
