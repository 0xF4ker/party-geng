"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaPluginType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PopularServices = () => {
  // FIX: Use useState with lazy initialization instead of useRef.
  // This ensures the plugin is created once and is safe to read during render.
  const [autoplayPlugin] = useState(() => {
    const AutoplayPlugin = Autoplay as unknown as (opts?: {
      delay?: number;
      stopOnInteraction?: boolean;
      stopOnMouseEnter?: boolean;
    }) => EmblaPluginType;

    return AutoplayPlugin({
      delay: 4000,
      stopOnInteraction: false, // Continue autoplay after user interaction
      stopOnMouseEnter: true, // Pause autoplay on hover
    });
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
    },
    [autoplayPlugin], // Pass the plugin instance directly from state
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const services = [
    {
      name: "Bands",
      image: "https://placehold.co/250x350/ec4899/ffffff?text=Bands",
      url: "/categories/bands",
    },
    {
      name: "Solo Musicians",
      image: "https://placehold.co/250x350/7c3aed/ffffff?text=Solo+Musicians",
      url: "/categories/solo-musicians",
    },
    {
      name: "Ensembles",
      image: "https://placehold.co/250x350/3b82f6/ffffff?text=Ensembles",
      url: "/categories/ensembles",
    },
    {
      name: "DJs",
      image: "https://placehold.co/250x350/ef4444/ffffff?text=DJs",
      url: "/categories/djs",
    },
    {
      name: "Variety Acts",
      image: "https://placehold.co/250x350/10b981/ffffff?text=Variety+Acts",
      url: "/categories/variety-acts",
    },
    {
      name: "Speakers",
      image: "https://placehold.co/250x350/f59e0b/ffffff?text=Speakers",
      url: "/categories/speakers",
    },
    {
      name: "Comedians",
      image: "https://placehold.co/250x350/6366f1/ffffff?text=Comedians",
      url: "/categories/comedians",
    },
    {
      name: "Tribute / Impersonators",
      image: "https://placehold.co/250x350/8b5cf6/ffffff?text=Tribute",
      url: "/categories/tribute-impersonators",
    },
    {
      name: "Party Rentals",
      image: "https://placehold.co/250x350/ec4899/ffffff?text=Party+Rentals",
      url: "/categories/party-rentals",
    },
    {
      name: "Photographers / Videographers",
      image: "https://placehold.co/250x350/7c3aed/ffffff?text=Photo+Video",
      url: "/categories/photographers-videographers",
    },
    {
      name: "Event Staffing",
      image: "https://placehold.co/250x350/3b82f6/ffffff?text=Event+Staffing",
      url: "/categories/event-staffing",
    },
    {
      name: "Personal Style",
      image: "https://placehold.co/250x350/ef4444/ffffff?text=Personal+Style",
      url: "/categories/personal-style",
    },
    {
      name: "Event Planning",
      image: "https://placehold.co/250x350/10b981/ffffff?text=Event+Planning",
      url: "/categories/event-planning",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Popular services</h2>
          {/* Hide buttons on mobile, let users swipe */}
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={scrollPrev}
              className="rounded-full border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}
              className="rounded-full border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-100"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Carousel Container */}
            <div className="-ml-4 flex">
              {" "}
              {/* Negative margin to offset slide padding */}
              {services.map((service) => (
                <div
                  className="shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6" // Responsive slide widths with padding
                  key={service.name}
                >
                  <Link
                    href={service.url}
                    className="group relative block h-[350px] overflow-hidden rounded-lg shadow-sm"
                  >
                    <Image
                      src={service.image}
                      alt={service.name}
                      className="absolute inset-0 h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                      width={250}
                      height={350}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 rounded-lg bg-linear-to-t from-black/60 via-black/10 to-transparent transition-all"></div>

                    {/* Text content moved to bottom */}
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{service.name}</h3>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* New Overlapping Buttons for Desktop */}
          <button
            onClick={scrollPrev}
            className="absolute top-1/2 left-0 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white lg:flex"
            aria-label="Previous service"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute top-1/2 right-0 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white lg:flex"
            aria-label="Next service"
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
