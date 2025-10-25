"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

const categories = [
  "DJs",
  "Photographers",
  "Videographers",
  "Comedians",
  "Speakers",
  "Party Rentals",
  "Personal Stylists",
  "Bands",
  "Solo Musicians",
  "Event Planners",
  "Variety Acts",
  "Graphics & Design",
  "Digital Marketing",
  "Video & Animation",
];

const CategoryCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

      // Initial check
      checkScroll();

      // Check on resize
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener("scroll", checkScroll);
        resizeObserver.unobserve(el);
      };
    }
  }, []); // Runs once on mount

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount =
        direction === "left" ? -el.clientWidth / 2 : el.clientWidth / 2;
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(
        "relative container mx-auto hidden w-full px-4 transition-all sm:block",
      )}
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
          {categories.map((category) => (
            <a
              key={category}
              href={`/categories/${category.toLowerCase().replace(/ /g, "-")}`}
              className="px-2 py-3 text-sm font-medium whitespace-nowrap text-gray-600 transition-all hover:border-b-2 hover:border-pink-500 hover:text-pink-500"
            >
              {category}
            </a>
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
    </div>
  );
};

export default CategoryCarousel;
