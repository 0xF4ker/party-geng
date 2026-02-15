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
import LoginJoinComponent from "../LoginJoinComponent";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/event-assets/ee4dcf92-748c-4995-839d-f00d502abc31.jpg",
    title: "Dream Weddings",
    subtitle: "Venues, Decor & Planning",
  },
  {
    id: 2,
    image: "/event-assets/7559b777-a27c-4ef8-9f71-9f8413c135f8.jpg",
    title: "Corporate Galas",
    subtitle: "Professional setups & Catering",
  },
  {
    id: 3,
    image: "/event-assets/e1599dd5-b393-4698-96b1-da811cc17065.jpg",
    title: "Live Entertainment",
    subtitle: "DJs, Bands & Sound",
  },
  {
    id: 4,
    image: "/event-assets/a9b65768-b894-44db-bb63-332a631fdebe.jpg",
    title: "Private Parties",
    subtitle: "Intimate gatherings & Celebrations",
  },
];

const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative h-full w-full sm:h-auto sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const Hero = () => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplayPlugin,
  ]);

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

  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

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
              <span className="brand-text-gradient block">
                Event Experiences
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-600 md:text-xl lg:mx-0">
              Connect with top talent, plan your dream event, and share your
              moments with a vibrant community. From weddings in Lagos to
              corporate galas in Abuja, bring your vision to life.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <button
                onClick={() => openModal("login")}
                className="transform rounded-xl bg-pink-600 px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-pink-700 hover:shadow-xl"
              >
                Find Vendors
              </button>
              <button
                onClick={() => openModal("login")}
                className="transform rounded-xl border-2 border-purple-600 bg-transparent px-8 py-3.5 font-bold text-purple-600 transition-all hover:-translate-y-1 hover:bg-purple-50"
              >
                Plan an Event
              </button>
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
                <div className="brand-text-gradient text-4xl font-bold">36</div>
                <p className="font-medium text-gray-600">States Covered</p>
              </div>
            </div>
          </div>

          {/* Right Column (Carousel) */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
            {/* Decorative blob */}
            <div className="absolute top-0 -left-4 -z-10 h-72 w-72 animate-pulse rounded-full bg-purple-300 opacity-30 blur-3xl filter"></div>
            <div className="animation-delay-2000 absolute -right-4 bottom-0 -z-10 h-72 w-72 animate-pulse rounded-full bg-pink-300 opacity-30 blur-3xl filter"></div>

            <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/30 shadow-2xl backdrop-blur-md">
              <div className="embla" ref={emblaRef}>
                <div className="flex">
                  {HERO_SLIDES.map((slide) => (
                    <div
                      className="relative min-w-full flex-[0_0_100%]"
                      key={slide.id}
                    >
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
                          <h3 className="mb-1 text-2xl font-bold">
                            {slide.title}
                          </h3>
                          <p className="font-medium text-gray-200">
                            {slide.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={scrollPrev}
                className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/40"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/40"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <Modal onClose={closeModal}>
          <LoginJoinComponent
            isModal={true}
            initialView={modalView}
            onClose={closeModal}
          />
        </Modal>
      )}
    </section>
  );
};

export default Hero;
