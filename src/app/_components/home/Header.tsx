"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, Search } from "lucide-react";
import LoginJoinComponent from "../LoginJoinComponent";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 flex items-center justify-between p-4 transition-all lg:px-10",
        isScrolled
          ? "bg-white shadow-lg"
          : "bg-gray-100 text-gray-800 shadow-md",
      )}
    >
      <div className="flex items-center">
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <Link href="/">
          <h1
            className={cn(
              "ml-4 text-3xl font-bold",
              isScrolled ? "brand-text-gradient" : "text-pink-500",
            )}
          >
            Partygeng
          </h1>
        </Link>
      </div>
      <div
        className={cn(
          "mx-16 hidden flex-grow lg:flex",
          isScrolled ? "block" : "hidden",
        )}
      >
        <div className="flex w-full">
          <input
            type="text"
            placeholder="What service are you looking for today?"
            className="w-full rounded-l-md border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none"
          />
          <button className="rounded-r-md bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className="main-nav hidden items-center space-x-4 lg:flex">
        <Link href="/pro" className="hover:text-pink-500">
          Partygeng Pro
        </Link>
        {/* <Link href="/explore" className="hover:text-pink-500">
          Explore
        </Link> */}
        <Link href="/start_selling" className="hover:text-pink-500">
          Become a Vendor
        </Link>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setModalView("login");
          }}
          className="hover:text-pink-500"
        >
          Sign in
        </button>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setModalView("join");
          }}
          className="rounded-md border border-gray-300 px-4 py-2 text-pink-500 hover:bg-pink-500 hover:text-white"
        >
          Join
        </button>
      </nav>
      <div className="tablet-nav hidden md:flex lg:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className={`mobile-menu fixed inset-0 z-50 flex md:hidden ${isMobileMenuOpen ? "open" : ""}`}
        >
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex w-full max-w-xs flex-col bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Partygeng</h2>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col space-y-4">
              <Link href="/pro" className="hover:text-pink-500">
                Partygeng Pro
              </Link>
              {/* <Link href="/explore" className="hover:text-pink-500">
                Explore
              </Link> */}
              <Link href="/start_selling" className="hover:text-pink-500">
                Become a Vendor
              </Link>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setModalView("login");
                  setIsMobileMenuOpen(false);
                }}
                className="hover:text-pink-500"
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setModalView("join");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-pink-500 hover:bg-pink-500 hover:text-white"
              >
                Join
              </button>
            </nav>
          </div>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <LoginJoinComponent
            isModal={true}
            initialView={modalView}
            onClose={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </header>
  );
};

export default Header;
