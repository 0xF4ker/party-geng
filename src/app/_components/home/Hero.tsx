"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaPluginType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    image: "https://placehold.co/600x500/ec4899/ffffff?text=Weddings",
    title: "Dream Weddings",
    subtitle: "Venues, Decor & Planning",
  },
  {
    id: 2,
    image: "https://placehold.co/600x500/7c3aed/ffffff?text=Corporate+Events",
    title: "Corporate Galas",
    subtitle: "Professional setups & Catering",
  },
  {
    id: 3,
    image: "https://placehold.co/600x500/3b82f6/ffffff?text=Concerts",
    title: "Live Entertainment",
    subtitle: "DJs, Bands & Sound",
  },
  {
    id: 4,
    image: "https://placehold.co/600x500/f59e0b/ffffff?text=Private+Parties",
    title: "Private Parties",
    subtitle: "Intimate gatherings & Celebrations",
  },
];

const Hero = () => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const { profile } = useAuthStore();
  const { headerHeight } = useUiStore();

  // Embla Carousel Setup
  const [autoplayPlugin] = useState(() => {
    const AutoplayPlugin = Autoplay as unknown as (opts?: {
      delay?: number;
      stopOnInteraction?: boolean;
      stopOnMouseEnter?: boolean;
    }) => EmblaPluginType;

    return AutoplayPlugin({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    });
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  useEffect(() => {
    fetch("/lottiefiles/Fireworks.json")
      .then((response) => response.json())
      .then((data: unknown) => {
        setAnimationData(data as object);
      })
      .catch((error) =>
        console.error("Error loading Lottie animation:", error),
      );
  }, []);

  const planEventHref = profile ? "/manage_events" : "/login";

  return (
    <section 
      className="relative overflow-hidden bg-pink-50/50"
      style={{ paddingTop: headerHeight ? `${headerHeight}px` : undefined }}
    >
      {/* 1. Video Background / Animation */}
      <div className="absolute inset-0 z-0 h-full w-full opacity-40">
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            rendererSettings={{
              preserveAspectRatio: "xMidYMid slice",
            }}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>

      <div className="relative z-20 container mx-auto px-6 py-20 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl leading-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
              The Ultimate Hub for
              <span className="brand-text-gradient block">Event Experiences</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-600 md:text-xl lg:mx-0">
              Connect with top talent, plan your dream event, and share your moments with a vibrant community. 
              From weddings in Lagos to corporate galas in Abuja, bring your vision to life.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/categories"
                className="transform rounded-xl bg-pink-600 px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-pink-700 hover:shadow-xl"
              >
                Find Vendors
              </Link>
              <Link
                href={planEventHref}
                className="transform rounded-xl border-2 border-purple-600 bg-transparent px-8 py-3.5 font-bold text-purple-600 transition-all hover:-translate-y-1 hover:bg-purple-50"
              >
                Plan an Event
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap justify-center gap-8 lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="brand-text-gradient text-4xl font-bold">
                  2,000+
                </div>
                <p className="font-medium text-gray-600">Verified Vendors</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="brand-text-gradient text-4xl font-bold">
                  98%
                </div>
                <p className="font-medium text-gray-600">5-Star Reviews</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="brand-text-gradient text-4xl font-bold">
                  36
                </div>
                <p className="font-medium text-gray-600">States Covered</p>
              </div>
            </div>
          </div>

          {/* Right Column (Carousel) */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
             {/* Decorative blob */}
             <div className="absolute top-0 -left-4 -z-10 h-72 w-72 animate-pulse rounded-full bg-purple-300 opacity-30 blur-3xl filter"></div>
             <div className="absolute bottom-0 -right-4 -z-10 h-72 w-72 animate-pulse rounded-full bg-pink-300 opacity-30 blur-3xl filter animation-delay-2000"></div>

            <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/30 shadow-2xl backdrop-blur-md">
              <div className="embla" ref={emblaRef}>
                <div className="flex">
                  {HERO_SLIDES.map((slide) => (
                    <div className="relative min-w-full flex-[0_0_100%]" key={slide.id}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          priority={slide.id === 1}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                          <h3 className="text-2xl font-bold mb-1">{slide.title}</h3>
                          <p className="text-gray-200 font-medium">{slide.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button 
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:bg-white/40 hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:bg-white/40 hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
