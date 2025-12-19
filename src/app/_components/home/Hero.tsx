"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const Hero = () => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const { profile } = useAuthStore();
  const { headerHeight } = useUiStore();
  
  useEffect(() => {
    fetch("/lottiefiles/Fireworks.json")
      .then((response) => response.json())
      .then((data: unknown) => {
        // 5. Once fetched, set it into the state
        setAnimationData(data as object);
      })
      .catch((error) =>
        console.error("Error loading Lottie animation:", error),
      );
  }, []);

  // Determine the 'Plan an Event' destination
  // If logged in: go to /manage_events
  // If not logged in: go to /login (which should ideally handle redirect, or user manually navigates)
  // The requirement says: "link to the login page... else link them to manage_events"
  const planEventHref = profile ? "/manage_events" : "/login";

  return (
    // The <section> remains relative
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

      {/* 3. Content (must have a higher z-index) */}
      <div className="relative z-20 container mx-auto px-6 py-20 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl leading-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
              The #1 Marketplace for
              <span className="brand-text-gradient block">Event Vendors</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-600 md:text-xl lg:mx-0">
              From weddings in Lagos to corporate galas in Abuja. Connect with trusted vendors, 
              manage your bookings, and bring your dream events to life across Nigeria.
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

          {/* Right Column (The glass card) */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
             {/* Decorative blob */}
             <div className="absolute top-0 -left-4 -z-10 h-72 w-72 animate-pulse rounded-full bg-purple-300 opacity-30 blur-3xl filter"></div>
             <div className="absolute bottom-0 -right-4 -z-10 h-72 w-72 animate-pulse rounded-full bg-pink-300 opacity-30 blur-3xl filter animation-delay-2000"></div>

            <div className="vendor-card rounded-2xl border border-white/40 bg-white/60 p-4 shadow-2xl backdrop-blur-md">
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src="/banner.jpg" 
                  alt="Featured Event Vendor"
                  className="h-64 w-full object-cover"
                  width={600}
                  height={400}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 right-4 flex items-center space-x-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-yellow-500 backdrop-blur-sm shadow-sm">
                  <span>★</span>
                  <span className="text-gray-900">5.0</span>
                </div>
                <div className="absolute right-4 bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">Eko Hotels & Suites</h3>
                  <div className="mt-2 flex items-center text-sm font-medium">
                    <span className="rounded-md bg-purple-600/90 px-2 py-0.5 backdrop-blur-md">
                      Venue
                    </span>
                    <span className="ml-2 flex items-center text-gray-100">
                      <span className="mr-1">📍</span>
                      Victoria Island, Lagos
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700 font-medium">
                  Luxury event spaces for weddings, conferences, and concerts.
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-200" />
                    ))}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                      +42
                    </span>
                  </div>
                  <Link
                    href="/categories/venues"
                    className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
