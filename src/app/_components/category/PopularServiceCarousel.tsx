import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PopularServiceCarousel = ({ services }: { services: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount =
        direction === "left"
          ? -scrollRef.current.clientWidth / 2
          : scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    handleScroll(); // Initial check
  }, [services]);

  return (
    <div className="relative">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "absolute top-1/2 -left-4 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-md transition-opacity hover:bg-gray-100",
          showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Services List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex space-x-3 overflow-x-auto py-4"
      >
        {services.map((service) => (
          <a
            key={service}
            href="#"
            className="flex flex-shrink-0 items-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <span>{service}</span>
            <ArrowRight className="h-4 w-4 text-gray-500" />
          </a>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className={cn(
          "absolute top-1/2 -right-4 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-md transition-opacity hover:bg-gray-100",
          showRightArrow ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default PopularServiceCarousel;
