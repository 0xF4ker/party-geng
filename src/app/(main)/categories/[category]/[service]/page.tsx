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
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type VendorListOutput = RouterOutput["vendor"]["getVendorsByService"];
type vendorProfileWithUser = VendorListOutput["vendors"][number];

type FilterState = {
  minRating?: number;
  location?: string;
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
                <RatingFilter
                  selectedRating={filters.minRating}
                  onApply={(rating) => handleApplyFilters({ minRating: rating })}
                  onClear={() => handleApplyFilters({ minRating: undefined })}
                />
              </FilterDropdown>
              <FilterDropdown title="Location">
                <LocationFilter
                  selectedLocation={filters.location}
                  onApply={(location) => handleApplyFilters({ location })}
                  onClear={() => handleApplyFilters({ location: undefined })}
                />
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

  return (
    <div>
      <div className="flex items-center space-x-3">
        <input
          type="number"
          placeholder="Minimum Rating"
          value={localRating ?? ""}
          onChange={(e) =>
            setLocalRating(
              e.target.value ? parseFloat(e.target.value) : undefined,
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
          min="1"
          max="5"
          step="0.1"
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 pt-3">
        <button
          onClick={() => {
            setLocalRating(undefined);
            onClear();
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => onApply(localRating)}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const LocationFilter = ({
  selectedLocation,
  onApply,
  onClear,
}: {
  selectedLocation?: string;
  onApply: (location?: string) => void;
  onClear: () => void;
}) => {
  const [localLocation, setLocalLocation] = useState<string>(
    selectedLocation ?? "",
  );

  return (
    <div>
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="e.g. Lagos"
          value={localLocation}
          onChange={(e) => setLocalLocation(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-pink-500"
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 pt-3">
        <button
          onClick={() => {
            setLocalLocation("");
            onClear();
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => onApply(localLocation)}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

const VendorCard = ({
  vendor,
  categorySlug,
  serviceSlug,
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
