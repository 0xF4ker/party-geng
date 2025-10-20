"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PopularServices = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

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
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between px-4">
          <h2 className="text-3xl font-bold">Popular services</h2>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="rounded-full border border-gray-300 bg-gray-100 p-2 hover:bg-gray-200"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}
              className="rounded-full border border-gray-300 bg-gray-100 p-2 hover:bg-gray-200"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {services.map((service) => (
              <div
                className="w-full flex-shrink-0 px-2 sm:w-1/2 md:w-1/3 lg:w-1/5"
                key={service.name}
              >
                <Link href={service.url} className="group relative block">
                  <Image
                    src={service.image}
                    alt={service.name}
                    width={250}
                    height={350}
                    unoptimized
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <div className="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 rounded-lg transition-all"></div>
                  <div className="absolute top-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{service.name}</h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
