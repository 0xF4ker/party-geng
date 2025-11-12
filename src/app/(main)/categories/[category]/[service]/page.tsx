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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
// import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
type gig = routerOutput["gig"]["getById"];

interface FilterState {
  minBudget?: number;
  maxBudget?: number;
  vendorLevels: string[];
  tags: string[];
}

// --- Main Page Component ---
const ServiceListingPage = () => {
  const params = useParams();
  const categorySlug = params?.category as string;
  const serviceSlug = params?.service as string;

  // Convert slug to service name
  const serviceName = serviceSlug
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    vendorLevels: [],
    tags: [],
  });
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch gigs with filters
  const { data, isLoading } = api.gig.getByService.useQuery({
    serviceName,
    filters: {
      minBudget: filters.minBudget,
      maxBudget: filters.maxBudget,
      vendorLevels:
        filters.vendorLevels.length > 0 ? filters.vendorLevels : undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
    },
    limit,
    offset,
  });

  const gigs = data?.gigs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);
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

  // Apply filters handler
  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setFilters({ vendorLevels: [], tags: [] });
    setPage(1);
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-white pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    );
  }

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
          <Link
            href={`/categories/${categorySlug}`}
            className="hover:text-pink-600"
          >
            {categorySlug
              ?.split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Link>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{serviceName}</h1>
        <p className="mb-6 max-w-3xl text-lg text-gray-600">
          Find the best {serviceName?.toLowerCase()} for your event. Book
          verified, professional vendors on Party-Geng.
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
                <EventTypeFilter
                  selectedTags={filters.tags}
                  onApply={(tags) => handleApplyFilters({ tags })}
                  onClear={() => handleApplyFilters({ tags: [] })}
                />
              </FilterDropdown>
              <FilterDropdown title="Seller Details">
                <SellerDetailsFilter
                  selectedLevels={filters.vendorLevels}
                  onApply={(levels) =>
                    handleApplyFilters({ vendorLevels: levels })
                  }
                  onClear={() => handleApplyFilters({ vendorLevels: [] })}
                />
              </FilterDropdown>
              <FilterDropdown title="Budget">
                <BudgetFilter
                  minBudget={filters.minBudget}
                  maxBudget={filters.maxBudget}
                  onApply={(min, max) =>
                    handleApplyFilters({ minBudget: min, maxBudget: max })
                  }
                  onClear={() =>
                    handleApplyFilters({
                      minBudget: undefined,
                      maxBudget: undefined,
                    })
                  }
                />
              </FilterDropdown>

              {filters.vendorLevels.length > 0 ||
              filters.tags.length > 0 ||
              filters.minBudget ||
              filters.maxBudget ? (
                <button
                  onClick={handleClearFilters}
                  className="ml-auto text-sm font-medium text-pink-600 hover:text-pink-700"
                >
                  Clear all filters
                </button>
              ) : null}

              <button className="ml-auto rounded-md border p-2 hover:bg-gray-100 lg:hidden">
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="my-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${totalCount.toLocaleString()} results`
            )}
          </span>
        </div>

        {/* Gigs Grid */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : gigs.length === 0 ? (
          <div className="flex h-96 flex-col items-center justify-center">
            <p className="text-lg text-gray-600">
              No services found matching your criteria.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                categorySlug={categorySlug}
                serviceSlug={serviceSlug}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
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
        </div>
      )}
    </div>
  );
};

// --- Specific Filter UIs ---

const CheckboxItem = ({
  label,
  value,
  isChecked,
  onToggle,
}: {
  label: string;
  value: string;
  isChecked: boolean;
  onToggle: () => void;
}) => {
  return (
    <label className="flex cursor-pointer items-center space-x-3 rounded p-1.5 hover:bg-gray-50">
      <div
        onClick={onToggle}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
          isChecked ? "border-pink-600 bg-pink-600" : "border-gray-300",
        )}
      >
        {isChecked && <Check className="h-3 w-3 text-white" />}
      </div>
      <span className="grow text-sm text-gray-700">{label}</span>
    </label>
  );
};

const EventTypeFilter = ({
  selectedTags,
  onApply,
  onClear,
}: {
  selectedTags: string[];
  onApply: (tags: string[]) => void;
  onClear: () => void;
}) => {
  const [localTags, setLocalTags] = useState<string[]>(selectedTags);

  const eventTypes = [
    { label: "Wedding", value: "Wedding" },
    { label: "Birthday Party", value: "Birthday" },
    { label: "Corporate Event", value: "Corporate" },
    { label: "Concert", value: "Concert" },
    { label: "Other", value: "Other" },
  ];

  const toggleTag = (tag: string) => {
    setLocalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div>
      <div className="space-y-2">
        {eventTypes.map((type) => (
          <CheckboxItem
            key={type.value}
            label={type.label}
            value={type.value}
            isChecked={localTags.includes(type.value)}
            onToggle={() => toggleTag(type.value)}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 pt-3">
        <button
          onClick={() => {
            setLocalTags([]);
            onClear();
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => onApply(localTags)}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const SellerDetailsFilter = ({
  selectedLevels,
  onApply,
  onClear,
}: {
  selectedLevels: string[];
  onApply: (levels: string[]) => void;
  onClear: () => void;
}) => {
  const [localLevels, setLocalLevels] = useState<string[]>(selectedLevels);

  const vendorLevels = [
    { label: "Top Rated Seller", value: "Top Rated" },
    { label: "Level 2 Seller", value: "Level 2" },
    { label: "Level 1 Seller", value: "Level 1" },
    { label: "Level 0 Seller", value: "Level 0" },
  ];

  const toggleLevel = (level: string) => {
    setLocalLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  return (
    <div>
      <div className="space-y-2">
        {vendorLevels.map((level) => (
          <CheckboxItem
            key={level.value}
            label={level.label}
            value={level.value}
            isChecked={localLevels.includes(level.value)}
            onToggle={() => toggleLevel(level.value)}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 pt-3">
        <button
          onClick={() => {
            setLocalLevels([]);
            onClear();
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => onApply(localLevels)}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const BudgetFilter = ({
  minBudget,
  maxBudget,
  onApply,
  onClear,
}: {
  minBudget?: number;
  maxBudget?: number;
  onApply: (min?: number, max?: number) => void;
  onClear: () => void;
}) => {
  const [localMin, setLocalMin] = useState<string>(minBudget?.toString() ?? "");
  const [localMax, setLocalMax] = useState<string>(maxBudget?.toString() ?? "");

  return (
    <div>
      <div className="flex items-center space-x-3">
        <input
          type="number"
          placeholder="Min (₦)"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          placeholder="Max (₦)"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 pt-3">
        <button
          onClick={() => {
            setLocalMin("");
            setLocalMax("");
            onClear();
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => {
            const min = localMin ? parseFloat(localMin) : undefined;
            const max = localMax ? parseFloat(localMax) : undefined;
            onApply(min, max);
          }}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const GigCard = ({
  gig,
  categorySlug,
  serviceSlug,
}: {
  gig: gig;
  categorySlug: string;
  serviceSlug: string;
}) => {
  if (!gig) return null;
  const vendorName = gig.vendor.user.username;
  const vendorLevel = gig.vendor.level ?? "Level 0";
  const vendorAvatar = gig.vendor.avatarUrl;
  const rating = gig.vendor.rating;
  const orderCount = gig._count.orders;
  const imageUrl =
    gig.galleryImageUrls[0] ??
    "https://placehold.co/400x300/ec4899/ffffff?text=Gig";

  return (
    <div className="w-full">
      <Link
        href={`/categories/${categorySlug}/${serviceSlug}/${gig.id}`}
        className="group"
      >
        {/* Image */}
        <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={gig.title}
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
            src={
              vendorAvatar ??
              `https://placehold.co/24x24/eee/333?text=${vendorName[0]?.toUpperCase()}`
            }
            alt={vendorName}
            className="h-6 w-6 rounded-full"
            width={24}
            height={24}
          />
          <div>
            <span className="text-sm font-semibold hover:underline">
              {vendorName}
            </span>
            <p className="text-xs text-gray-500">{vendorLevel}</p>
          </div>
        </div>

        {/* Title */}
        <p className="mb-1.5 text-base text-gray-800 transition-colors hover:text-pink-600">
          {gig.title}
        </p>

        {/* Rating */}
        <div className="mb-2 flex items-center gap-1 text-sm text-gray-700">
          <Star className="h-4 w-4 fill-current text-yellow-400" />
          <span className="font-bold text-yellow-500">{rating.toFixed(1)}</span>
          <span className="text-gray-400">
            ({orderCount > 1000 ? "1k+" : orderCount})
          </span>
        </div>

        {/* Price */}
        <div>
          <span className="text-xs font-medium text-gray-500">FROM</span>
          <span className="ml-1.5 text-lg font-bold text-gray-900">
            ₦{gig.basePrice.toLocaleString()}
          </span>
        </div>
      </Link>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className="mt-16 flex items-center justify-center space-x-2"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {getPageNumbers().map((page, idx) =>
        typeof page === "number" ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors",
              page === currentPage
                ? "bg-pink-600 text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ) : (
          <span
            key={idx}
            className="flex h-10 w-10 items-end justify-center text-gray-500"
          >
            {page}
          </span>
        ),
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};

export default ServiceListingPage;
