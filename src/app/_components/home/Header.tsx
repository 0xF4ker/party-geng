"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, Search } from "lucide-react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        "fixed top-0 right-0 left-0 z-50 flex items-center justify-between p-4 transition-all",
        isScrolled
          ? "bg-white shadow-lg"
          : "bg-gray-100 text-gray-800 shadow-md",
      )}
    >
      <div className="flex items-center">
        <Link href="/">
          <h1
            className={cn(
              "text-3xl font-bold",
              isScrolled ? "brand-text-gradient" : "text-pink-500",
            )}
          >
            Partygeng
          </h1>
        </Link>
      </div>
      <div
        className={cn(
          "mx-8 hidden flex-grow md:flex",
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
      <nav className="hidden items-center space-x-6 md:flex">
        <Link href="/pro" className="hover:text-pink-500">
          Partygeng Pro
        </Link>
        <Link href="/explore" className="hover:text-pink-500">
          Explore
        </Link>
        <Link href="/start_selling" className="hover:text-pink-500">
          Become a Vendor
        </Link>
        <Link href="/login" className="hover:text-pink-500">
          Sign in
        </Link>
        <Link
          href="/join"
          className="rounded-md border border-gray-300 px-4 py-2 text-pink-500 hover:bg-pink-500 hover:text-white"
        >
          Join
        </Link>
      </nav>
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="absolute top-16 right-0 left-0 bg-white p-4 text-black shadow-lg md:hidden">
          <nav className="flex flex-col space-y-4">
            <Link href="/pro" className="hover:text-pink-500">
              Partygeng Pro
            </Link>
            <Link href="/explore" className="hover:text-pink-500">
              Explore
            </Link>
            <Link href="/start_selling" className="hover:text-pink-500">
              Become a Vendor
            </Link>
            <Link href="/login" className="hover:text-pink-500">
              Sign in
            </Link>
            <Link
              href="/join"
              className="rounded-md border border-gray-300 px-4 py-2 text-pink-500 hover:bg-pink-500 hover:text-white"
            >
              Join
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
