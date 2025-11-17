"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { slugify } from "@/lib/utils";
import { api } from "@/trpc/react";
import Link from "next/link";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
// 1. Get the type for the entire procedure's output (which can be null)
type CategoryOutput = routerOutput["category"]["getAll"][number];

type Category = NonNullable<CategoryOutput>;

const MegaMenu = ({
  category,
  onMouseEnter,
  onMouseLeave,
}: {
  category: Category;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  // Split services into columns for better layout
  const allServices = category.services;
  const columns = allServices.reduce(
    (acc, service, index) => {
      const colIndex = Math.floor(index / 10); // 10 items per column
      acc[colIndex] ??= [];
      acc[colIndex].push(service);
      return acc;
    },
    [] as (typeof allServices)[],
  );

  const categorySlug = category?.slug;

  return (
    <div
      className="absolute top-full right-0 left-0 z-30 w-full border-t border-gray-200 bg-white shadow-lg"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-row gap-8">
          <div className="w-1/4 shrink-0">
            <h3 className="text-2xl font-bold text-gray-800">
              {category.name}
            </h3>
            <p className="mt-2 text-gray-600">
              Find the best {category.name.toLowerCase()} for your event.
            </p>
            <Link
              href={`/categories/${categorySlug}`}
              className="mt-4 inline-block font-semibold text-pink-500 hover:underline"
            >
              All {category.name} services &rarr;
            </Link>
          </div>
          <div className="flex grow flex-row gap-8">
            {columns.map((column, colIndex) => (
              <ul key={colIndex} className="flex flex-col space-y-3">
                {column.map((service) => {
                  const serviceSlug = service?.slug;
                  const vendorsCount = service._count.vendors;
                  return (
                    <li key={service.id}>
                      <Link
                        href={`/categories/${categorySlug}/${serviceSlug}`}
                        className="flex items-center gap-2 text-gray-700 hover:text-pink-500"
                      >
                        <span>{service.name}</span>
                        <span className="text-xs text-gray-400">
                          ({vendorsCount})
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryCarousel = () => {
  // Fetch categories from database
  const { data: categoriesData = [] } = api.category.getAll.useQuery();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isAtStart = el.scrollLeft <= 0;
      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1; // -1 for subpixel precision
      setCanScrollLeft(!isAtStart);
      setCanScrollRight(!isAtEnd);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      checkScroll(); // Initial check
      return () => {
        el.removeEventListener("scroll", checkScroll);
        resizeObserver.unobserve(el);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount =
        direction === "left" ? -el.clientWidth / 2 : el.clientWidth / 2;
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const openMenu = (category: Category) => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
    menuTimerRef.current = setTimeout(() => {
      setHoveredCategory(category);
    }, 500);
  };

  const closeMenu = () => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
    menuTimerRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  const cancelMenuTimer = () => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
  };

  return (
    <div
      className={cn(
        "relative container mx-auto hidden w-full max-w-7xl px-4 sm:block",
      )}
      onMouseLeave={closeMenu}
    >
      {/* Show on sm+ screens */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 left-0 z-10 ml-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-all hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex items-center overflow-x-auto scroll-smooth py-1" // scrollbar-hide needs a plugin or custom CSS
      >
        <div className="flex items-center space-x-4">
          {categoriesData.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${slugify(category.name)}`}
              className="px-2 py-3 text-sm font-medium whitespace-nowrap text-gray-600 transition-all hover:border-b-2 hover:border-pink-500 hover:text-pink-500"
              onMouseEnter={() => openMenu(category)}
              onMouseLeave={cancelMenuTimer}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 right-0 z-10 mr-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-all hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      {/* Simple "scrollbar-hide" utility class implementation */}
      <style>
        {`.scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}
      </style>

      {/* --- Render Mega Menu --- */}
      {hoveredCategory && (
        <MegaMenu
          category={hoveredCategory}
          onMouseEnter={cancelMenuTimer}
          onMouseLeave={closeMenu}
        />
      )}
    </div>
  );
};

export default CategoryCarousel;
