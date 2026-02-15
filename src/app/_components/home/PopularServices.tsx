"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaPluginType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";

const CATEGORY_IMAGES: Record<string, string> = {
  "Music & DJs": "/event-assets/e1599dd5-b393-4698-96b1-da811cc17065.jpg",
  "Food & Beverage": "/event-assets/7559b777-a27c-4ef8-9f71-9f8413c135f8.jpg",
  Media: "/event-assets/9643dd1a-54f9-42e6-8545-3d33ac2fa109.jpg",
  Planning: "/event-assets/ee4dcf92-748c-4995-839d-f00d502abc31.jpg",
  "Decor & Design": "/event-assets/e07c8405-3ec3-48ac-bc60-f2f9dc61d72c.jpg",
  Entertainment: "/event-assets/a9b65768-b894-44db-bb63-332a631fdebe.jpg",
  "Equipment Rental": "/event-assets/00f63a28-6006-42af-9a69-c064a333977a.jpg",
  Transportation: "/event-assets/6adc089e-464b-481b-8087-29bc9b331ee3.jpg",
  "Personal Style": "/event-assets/5ec493b6-99b3-48ca-bfdd-92a35801eaeb.jpg",
  "Event Staffing": "/event-assets/a3e3fa3e-41fd-4827-8a79-d9e954497c1f.jpg",
  "Event Venue": "/event-assets/5a132bcc-0437-4c5f-a5f9-ff7518f7b50a.jpg",
};

const DEFAULT_IMAGE = "https://placehold.co/250x350/9ca3af/ffffff?text=Service";

const PopularServices = () => {
  const { data: categories } = api.category.getAll.useQuery();

  const [autoplayPlugin] = useState(() => {
    const AutoplayPlugin = Autoplay as unknown as (opts?: {
      delay?: number;
      stopOnInteraction?: boolean;
      stopOnMouseEnter?: boolean;
    }) => EmblaPluginType;

    return AutoplayPlugin({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    });
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
    },
    [autoplayPlugin],
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Combine categories and their services into a display list
  // For now, let's just display the top-level categories as "Popular Services"
  // or we could flatten the services. The prompt implies "Popular Services"
  // but showing categories is often better for navigation.
  // Given the seed data structure, let's show Categories.

  const itemsToDisplay =
    categories?.map((category) => ({
      name: category.name,
      image: CATEGORY_IMAGES[category.name] ?? DEFAULT_IMAGE,
      url: `/categories/${category.slug}`,
    })) ?? [];

  // Fallback if no data yet (e.g. loading or empty DB)
  // This matches the seed data so it looks good immediately
  const fallbackItems = Object.entries(CATEGORY_IMAGES).map(
    ([name, image]) => ({
      name,
      image,
      url: `/categories/${name.toLowerCase().replace(/ & /g, "-and-").replace(/ /g, "-")}`,
    }),
  );

  const displayItems =
    itemsToDisplay.length > 0 ? itemsToDisplay : fallbackItems;

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Explore Categories</h2>
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

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-4 flex">
              {displayItems.map((item) => (
                <div
                  className="shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6"
                  key={item.name}
                >
                  <Link
                    href={item.url}
                    className="group relative block h-[350px] overflow-hidden rounded-lg shadow-sm"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                      width={250}
                      height={350}
                    />
                    <div className="absolute inset-0 rounded-lg bg-linear-to-t from-black/60 via-black/10 to-transparent transition-all"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{item.name}</h3>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute top-1/2 left-0 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white lg:flex"
            aria-label="Previous category"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute top-1/2 right-0 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white lg:flex"
            aria-label="Next category"
          >
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
