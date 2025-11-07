"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Home,
  ChevronDown,
  Star,
  Heart,
  ChevronLeft,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const serviceDetails = {
  category: "Music & DJs",
  service: "Wedding DJs",
  categorySlug: "music-djs",
  serviceSlug: "wedding-djs",
};

interface Gig {
  id: number;
  sellerName: string;
  level: string;
  description: string;
  rating: number;
  reviews: number | string;
  price: number;
  imageUrl: string;
}

const gigsData: Gig[] = [
  {
    id: 1,
    sellerName: "DJ SpinMaster",
    level: "Level 2",
    description: "I will be the professional wedding DJ for your reception",
    rating: 4.9,
    reviews: 131,
    price: 150000,
    imageUrl: "https://placehold.co/400x300/ec4899/ffffff?text=Wedding+DJ",
  },
  {
    id: 2,
    sellerName: "MC King",
    level: "Top Rated",
    description: "I will be your charismatic MC and event host",
    rating: 5.0,
    reviews: 210,
    price: 120000,
    imageUrl: "https://placehold.co/400x300/8b5cf6/ffffff?text=Event+MC",
  },
  {
    id: 3,
    sellerName: "Lagos Party Band",
    level: "Level 2",
    description: "I will play live high-energy music for your party",
    rating: 4.8,
    reviews: 78,
    price: 250000,
    imageUrl: "https://placehold.co/400x300/3b82f6/ffffff?text=Live+Band",
  },
  {
    id: 4,
    sellerName: "DJ Switch",
    level: "Pro Verified",
    description: "I will provide premium DJ services for corporate events",
    rating: 5.0,
    reviews: "1k+",
    price: 400000,
    imageUrl: "https://placehold.co/400x300/ef4444/ffffff?text=Corporate+DJ",
  },
  {
    id: 5,
    sellerName: "Abuja String Quartet",
    level: "Level 1",
    description: "I will play beautiful classical music for your ceremony",
    rating: 4.9,
    reviews: 42,
    price: 180000,
    imageUrl: "https://placehold.co/400x300/f59e0b/ffffff?text=String+Quartet",
  },
  {
    id: 6,
    sellerName: "Photobooth Fun",
    level: "Level 2",
    description: "I will provide a modern photobooth for your event",
    rating: 4.9,
    reviews: 112,
    price: 80000,
    imageUrl: "https://placehold.co/400x300/10b981/ffffff?text=Photobooth",
  },
  {
    id: 7,
    sellerName: "SaxAppeal",
    level: "Top Rated",
    description: "I will play romantic saxophone music for your dinner",
    rating: 5.0,
    reviews: 98,
    price: 100000,
    imageUrl: "https://placehold.co/400x300/6366f1/ffffff?text=Saxophonist",
  },
  {
    id: 8,
    sellerName: "SnapPro",
    level: "Pro Verified",
    description: "I will provide full-day wedding photography coverage",
    rating: 5.0,
    reviews: 55,
    price: 550000,
    imageUrl: "https://placehold.co/400x300/8d99ae/ffffff?text=Photographer",
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const ServiceListingPage = () => {
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterPlaceholderRef = useRef<HTMLDivElement>(null);

  // Effect for sticky filter bar
  useEffect(() => {
    const filterEl = filterRef.current;
    const placeholderEl = filterPlaceholderRef.current;
    if (!filterEl || !placeholderEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsFilterSticky(entry.intersectionRatio < 1);
        }
      },
      { threshold: [1] },
    );

    observer.observe(placeholderEl);

    return () => {
      if (placeholderEl) observer.unobserve(placeholderEl);
    };
  }, []);

  return (
    // FIX: Use specific pixel values for header padding
    <div className="min-h-screen bg-white pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-pink-600">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <a
            href={`/categories/${serviceDetails.categorySlug}`}
            className="hover:text-pink-600"
          >
            {serviceDetails.category}
          </a>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">
          {serviceDetails.service}
        </h1>
        <p className="mb-6 max-w-3xl text-lg text-gray-600">
          Find the best DJs to bring your wedding reception to life. Book
          verified, professional DJs on Partygeng.
        </p>

        {/* Sticky Filter Bar Placeholder */}
        <div ref={filterPlaceholderRef} className="h-0.5"></div>

        {/* Filter Bar */}
        <div
          ref={filterRef}
          className={cn(
            "z-10 bg-white transition-shadow duration-200",
            isFilterSticky
              ? // FIX: Use specific pixel values for sticky top
                "fixed top-[122px] right-0 left-0 border-b border-gray-200 shadow-md lg:top-[127px]"
              : "relative",
          )}
        >
          <div className="container mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 py-4">
              {/* FIX: Replaced simple buttons with interactive dropdowns */}
              <FilterDropdown title="Event Type">
                <EventTypeFilter />
              </FilterDropdown>
              <FilterDropdown title="Seller Details">
                <SellerDetailsFilter />
              </FilterDropdown>
              <FilterDropdown title="Budget">
                <BudgetFilter />
              </FilterDropdown>
              <FilterDropdown title="Event Date">
                <EventDateFilter />
              </FilterDropdown>

              <button className="ml-auto rounded-md border p-2 hover:bg-gray-100 lg:hidden">
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info & Sort */}
        <div className="my-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">1,800+ results</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by:</span>
            <button className="flex items-center font-semibold text-gray-900 hover:text-pink-600">
              Best selling <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gigsData.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination />
      </div>
    </div>
  );
};

// --- Sub-Components ---

// NEW: Interactive Filter Dropdown Component
const FilterDropdown = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:border-gray-400",
          isOpen
            ? "border-pink-600 bg-pink-50 text-pink-700"
            : "border-gray-300 text-gray-700 hover:bg-gray-50",
        )}
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="max-h-64 overflow-y-auto p-4">{children}</div>
          <div className="flex items-center justify-between rounded-b-lg border-t border-gray-200 bg-gray-50 p-3">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Specific Filter UIs ---

const CheckboxItem = ({ label, count }: { label: string; count: number }) => {
  const [isChecked, setIsChecked] = useState(false);
  return (
    <label className="flex cursor-pointer items-center space-x-3 rounded p-1.5 hover:bg-gray-50">
      <div
        onClick={() => setIsChecked(!isChecked)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
          isChecked ? "border-pink-600 bg-pink-600" : "border-gray-300",
        )}
      >
        {isChecked && <Check className="h-3 w-3 text-white" />}
      </div>
      <span className="grow text-sm text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </label>
  );
};

const EventTypeFilter = () => (
  <div className="space-y-2">
    <CheckboxItem label="Wedding" count={800} />
    <CheckboxItem label="Birthday Party" count={450} />
    <CheckboxItem label="Corporate Event" count={320} />
    <CheckboxItem label="Concert" count={150} />
    <CheckboxItem label="Other" count={80} />
  </div>
);

const SellerDetailsFilter = () => (
  <div className="space-y-2">
    <CheckboxItem label="Top Rated Seller" count={50} />
    <CheckboxItem label="Level 2 Seller" count={400} />
    <CheckboxItem label="Level 1 Seller" count={600} />
    <CheckboxItem label="New Seller" count={750} />
    <CheckboxItem label="Pro Verified" count={25} />
  </div>
);

const BudgetFilter = () => (
  <div className="flex items-center space-x-3">
    <input
      type="number"
      placeholder="Min (₦)"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
    />
    <span className="text-gray-400">-</span>
    <input
      type="number"
      placeholder="Max (₦)"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
    />
  </div>
);

const EventDateFilter = () => {
  const [selected, setSelected] = useState("any");
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center space-x-3 rounded p-1.5 hover:bg-gray-50">
        <input
          type="radio"
          name="event-date"
          value="any"
          checked={selected === "any"}
          onChange={(e) => setSelected(e.target.value)}
          className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-500"
        />
        <span className="text-sm text-gray-700">Anytime</span>
      </label>
      <label className="flex cursor-pointer items-center space-x-3 rounded p-1.5 hover:bg-gray-50">
        <input
          type="radio"
          name="event-date"
          value="30days"
          checked={selected === "30days"}
          onChange={(e) => setSelected(e.target.value)}
          className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-500"
        />
        <span className="text-sm text-gray-700">Next 30 days</span>
      </label>
      <label className="flex cursor-pointer items-center space-x-3 rounded p-1.5 hover:bg-gray-50">
        <input
          type="radio"
          name="event-date"
          value="custom"
          checked={selected === "custom"}
          onChange={(e) => setSelected(e.target.value)}
          className="h-4 w-4 border-gray-300 text-pink-600 focus:ring-pink-500"
        />
        <span className="text-sm text-gray-700">Pick a date</span>
      </label>
    </div>
  );
};

const GigCard = ({ gig }: { gig: Gig }) => {
  return (
    <div className="w-full">
      <a
        href={`/categories/${serviceDetails.categorySlug}/${serviceDetails.serviceSlug}/${gig.id}`}
        className="group"
      >
        {/* Image */}
        <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-lg">
          <Image
            src={gig.imageUrl}
            alt={gig.description}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={300}
          />
          <button className="absolute top-3 right-3 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
            <Heart className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        {/* Seller Info */}
        <div className="mb-1.5 flex items-center gap-2">
          <Image
            src={`https://placehold.co/24x24/eee/333?text=${gig.sellerName[0]?.toUpperCase()}`}
            alt={gig.sellerName}
            className="h-6 w-6 rounded-full"
            width={24}
            height={24}
          />
          <div>
            <span className="text-sm font-semibold hover:underline">
              {gig.sellerName}
            </span>
            <p className="text-xs text-gray-500">{gig.level}</p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-1.5 text-base text-gray-800 transition-colors hover:text-pink-600">
          {gig.description}
        </p>

        {/* Rating */}
        <div className="mb-2 flex items-center gap-1 text-sm text-gray-700">
          <Star className="h-4 w-4 fill-current text-yellow-400" />
          <span className="font-bold text-yellow-500">{gig.rating}</span>
          <span className="text-gray-400">({gig.reviews})</span>
        </div>

        {/* Price */}
        <div>
          <span className="text-xs font-medium text-gray-500">FROM</span>
          <span className="ml-1.5 text-lg font-bold text-gray-900">
            ₦{gig.price.toLocaleString()}
          </span>
        </div>
      </a>
    </div>
  );
};

const Pagination = () => {
  return (
    <nav
      className="mt-16 flex items-center justify-center space-x-2"
      aria-label="Pagination"
    >
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-semibold text-white"
        aria-current="page"
      >
        1
      </button>

      <button className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-gray-600 transition-colors hover:bg-gray-100">
        2
      </button>

      <button className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-gray-600 transition-colors hover:bg-gray-100">
        3
      </button>

      <span className="flex h-10 w-10 items-end justify-center text-gray-500">
        ...
      </span>

      <button className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-gray-600 transition-colors hover:bg-gray-100">
        12
      </button>

      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};

export default ServiceListingPage;
