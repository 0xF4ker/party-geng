"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Home,
  Star,
  Heart,
  ChevronLeft,
  SlidersHorizontal,
  Loader2,
  ChevronDown,
  X,
  MapPin,
  CircleDashed,
  Navigation,
  Check,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";

// --- Types ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type VendorListOutput = RouterOutput["vendor"]["getVendorsByService"];
type vendorProfileWithUser = VendorListOutput["vendors"][number];
type LocationFilterType = {
  lat: number;
  lon: number;
  radius: number;
};
type FilterState = {
  minRating?: number;
  location?: LocationFilterType;
};

// --- Main Page Component ---
const ServiceListingPage = () => {
  const params = useParams();
  const categorySlug = params?.category as string;
  const serviceSlug = params?.service as string;

  // Fetch service details to get serviceId
  const { data: serviceData, isLoading: isLoadingService } =
    api.category.getServiceBySlug.useQuery(
      { slug: serviceSlug },
      {
        enabled: !!serviceSlug,
      },
    );

  const serviceId = serviceData?.id;
  const serviceName = serviceData?.name;

  // Filter state
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch vendors with filters
  const { data, isLoading: isLoadingVendors } =
    api.vendor.getVendorsByService.useQuery(
      {
        serviceId: serviceId!, // Use the fetched serviceId
        filters: {
          minRating: filters.minRating,
          location: filters.location,
        },
        limit,
        offset,
      },
      {
        enabled: !!serviceId, // Only run query if serviceId is available
      },
    );

  const vendors = data?.vendors ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Apply filters handler
  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Overall loading state
  const isLoading = isLoadingService || isLoadingVendors;

  // Loading state
  if (isLoading && !serviceData) {
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

        {/* Filter Bar */}
        <div className="z-10 bg-white">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 py-4">
              <FilterDropdown title="Rating">
                {({ close }) => (
                  <RatingFilter
                    selectedRating={filters.minRating}
                    onApply={(rating) => {
                      handleApplyFilters({ minRating: rating });
                      close();
                    }}
                    onClear={() => {
                      handleApplyFilters({ minRating: undefined });
                      close();
                    }}
                  />
                )}
              </FilterDropdown>
              <FilterDropdown title="Location" align="left">
                {({ close }) => (
                  <LocationFilter
                    onApply={(location) => {
                      handleApplyFilters({ location });
                      close();
                    }}
                    onClear={() => {
                      handleApplyFilters({ location: undefined });
                      close();
                    }}
                  />
                )}
              </FilterDropdown>

              {filters.minRating || filters.location ? (
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

        {/* Vendors Grid */}
        {isLoading && vendors.length === 0 ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex h-96 flex-col items-center justify-center">
            <p className="text-lg text-gray-600">
              No vendors found matching your criteria.
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
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
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

interface FilterDropdownProps {
  title: string;
  align?: "left" | "right";
  children: (props: { close: () => void }) => React.ReactNode;
}

const FilterDropdown = ({
  title,
  align = "left",
  children,
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only run this logic on desktop (when it's not a modal)
      if (window.innerWidth >= 640) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Lock body scroll on mobile when open
      if (window.innerWidth < 640) document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
          isOpen
            ? "border-pink-600 bg-pink-50/80 text-pink-700 ring-4 ring-pink-100"
            : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-gray-50",
        )}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-pink-600",
            isOpen && "rotate-180 text-pink-600",
          )}
        />
      </button>

      {/* This is the "Out of the Box" Magic:
        We render an overlay AND the menu. 
        On mobile, the menu breaks free from the button and centers itself on screen.
      */}
      {isOpen && (
        <>
          {/* MOBILE BACKDROP: Only visible on small screens */}
          <div
            className="animate-in fade-in fixed inset-0 z-40 bg-black/30 backdrop-blur-sm duration-200 sm:hidden"
            onClick={close}
          />

          <div
            className={cn(
              // --- BASE STYLES ---
              "z-50 border border-gray-100 bg-white p-1 shadow-xl transition-all duration-200 ease-out",

              // --- MOBILE STYLES (The Modal) ---
              // Fixed to viewport, centered, 90% width.
              "fixed top-1/2 left-1/2 w-[90vw] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl",

              // --- DESKTOP STYLES (The Dropdown) ---
              // Reset fixed positioning, go back to absolute relative to button
              "sm:absolute sm:top-full sm:left-auto sm:mt-2 sm:w-[380px] sm:translate-x-0 sm:translate-y-0 sm:rounded-xl",

              // Desktop Alignment
              align === "right"
                ? "sm:right-0 sm:origin-top-right"
                : "sm:left-0 sm:origin-top-left",

              // Animation
              isOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0",
            )}
          >
            {/* Mobile Close Button (Optional UX improvement) */}
            <div className="mb-2 flex justify-end border-b border-gray-50 p-2 sm:hidden">
              <button
                onClick={close}
                className="rounded-full bg-gray-100 p-1 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-1">{children({ close })}</div>
          </div>
        </>
      )}
    </div>
  );
};

const RatingFilter = ({
  selectedRating,
  onApply,
  onClear,
}: {
  selectedRating?: number;
  onApply: (rating?: number) => void;
  onClear: () => void;
}) => {
  const [localRating, setLocalRating] = useState<number | undefined>(
    selectedRating,
  );
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleApply = () => {
    onApply(localRating);
  };

  const handleClear = () => {
    setLocalRating(undefined);
    onClear();
  };

  // Helper to determine star styling
  const getStarState = (index: number) => {
    // If hovering, use hover state. Otherwise use selected state.
    const activeValue = hoverRating ?? localRating ?? 0;
    return index <= activeValue;
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4 text-pink-600" />
          Minimum Rating
        </h3>
      </div>

      {/* Interactive Star Section */}
      <div className="px-5 py-6">
        <div
          className="flex justify-between gap-1"
          onMouseLeave={() => setHoverRating(0)} // Reset hover on leave
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setLocalRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              className="group relative focus:outline-none"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-all duration-200 ease-out",
                  getStarState(star)
                    ? "scale-110 fill-yellow-400 text-yellow-400"
                    : "fill-gray-100 text-gray-300 group-hover:text-yellow-200",
                )}
              />
              {/* Tooltip for specific star value */}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                {star}
              </span>
            </button>
          ))}
        </div>

        {/* Text Feedback */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-600">
            {localRating ? (
              <span className="font-bold text-pink-600">
                {localRating} Stars & Up
              </span>
            ) : (
              <span className="text-gray-400">Any Rating</span>
            )}
          </p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between rounded-b-xl border-t border-gray-50 bg-gray-50/50 px-5 py-4">
        <button
          onClick={handleClear}
          disabled={!localRating}
          className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          Reset
        </button>

        <button
          onClick={handleApply}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-pink-200 transition-all hover:bg-pink-700 hover:shadow-md active:scale-95 active:transform"
        >
          <Check className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>
    </div>
  );
};

const LocationFilter = ({
  onApply,
  onClear,
}: {
  onApply: (location?: LocationFilterType) => void;
  onClear: () => void;
}) => {
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [radius, setRadius] = useState(5000); // Default 5km in meters

  const handleApply = () => {
    if (location) {
      onApply({
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        radius: radius,
      });
    }
  };

  const handleClear = () => {
    setLocation(null);
    setRadius(5000); // Reset radius
    onClear();
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Header Section */}
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <MapPin className="h-4 w-4 text-pink-600" />
          Location & Distance
        </h3>
      </div>

      <div className="space-y-6 px-5 py-5">
        {/* Search Input Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Center Point
          </label>
          <div className="relative">
            <LocationSearchInput
              onLocationSelect={setLocation}
              initialValue={location?.display_name}
              // You might need to pass styling props to your input to make it match
              // className="w-full rounded-lg border-gray-200 pl-10 focus:border-pink-500 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Radius Slider Section - Only shows when location is selected */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            location
              ? "translate-y-0 opacity-100"
              : "pointer-events-none opacity-50 grayscale"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <CircleDashed className="h-4 w-4 text-gray-400" />
              Search Radius
            </label>
            <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-bold text-pink-700">
              {(radius / 1000).toFixed(1)} km
            </span>
          </div>

          <div className="relative flex h-6 w-full items-center">
            {/* Custom Range Slider */}
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              disabled={!location}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-pink-600 focus:ring-2 focus:ring-pink-500/20 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-gray-400">
            <span>1 km</span>
            <span>25 km</span>
            <span>50 km</span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between rounded-b-xl border-t border-gray-50 bg-gray-50/50 px-5 py-4">
        <button
          onClick={handleClear}
          disabled={!location}
          className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          Reset
        </button>

        <button
          onClick={handleApply}
          disabled={!location}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-pink-200 transition-all hover:bg-pink-700 hover:shadow-md active:scale-95 active:transform disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          <Navigation className="h-3.5 w-3.5 fill-current" />
          Apply Filter
        </button>
      </div>
    </div>
  );
};

const VendorCard = ({
  vendor,
  categorySlug: _categorySlug,
  serviceSlug: _serviceSlug,
}: {
  vendor: vendorProfileWithUser;
  categorySlug: string;
  serviceSlug: string;
}) => {
  if (!vendor?.user) return null;
  const rating = vendor.rating;
  const imageUrl =
    vendor.bannerUrl ??
    "https://placehold.co/400x300/ec4899/ffffff?text=Vendor"; // Use bannerUrl for vendor card

  return (
    <div className="w-full">
      <Link href={`/v/${vendor.user.username}`} className="group">
        {/* Image */}
        <div className="relative mb-3 aspect-4/3 w-full overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={vendor.companyName ?? vendor.user.username ?? "Vendor"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={300}
          />
          <button className="absolute top-3 right-3 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
            <Heart className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        {/* Title */}
        <p className="mb-1.5 text-base text-gray-800 transition-colors hover:text-pink-600">
          {vendor.companyName ?? "Unnamed Vendor"}
        </p>

        {/* Rating */}
        <div className="mb-2 flex items-center gap-1 text-sm text-gray-700">
          <Star className="h-4 w-4 fill-current text-yellow-400" />
          <span className="font-bold text-yellow-500">{rating.toFixed(1)}</span>
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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
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
