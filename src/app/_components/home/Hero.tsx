import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";

const Hero = () => {
  const [animationData, setAnimationData] = useState<object | null>(null);
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
  return (
    // The <section> remains relative
    <section className="relative overflow-hidden">
      {/* 1. Video Background */}
      <div className="absolute inset-0 z-0 h-full w-full object-cover">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          // This makes it fill the container like 'object-fit: cover'
          rendererSettings={{
            preserveAspectRatio: "xMidYMid slice",
          }}
          // This makes the Lottie canvas fill its parent div
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* 2. Dark Overlay */}
      {/* This is crucial for making text readable over the video */}
      {/* <div className="absolute inset-0 z-10 bg-black/40"></div> */}

      {/* 3. Content (must have a higher z-index) */}
      <div className="relative z-20 container mx-auto px-6 py-44 md:py-48">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column */}
          <div className="text-center lg:text-left">
            {/* Text color changed to white for readability */}
            <h1 className="text-4xl leading-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Plan Perfect
              <span className="brand-text-gradient">Events Together</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg text-gray-600 md:text-xl lg:mx-0">
              Connect with amazing vendors, plan unforgettable events, and share
              your celebrations with a vibrant community.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/trending"
                className="transform rounded-full bg-pink-500 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-pink-600"
              >
                Find Vendors
              </Link>
              <Link
                href="#"
                className="transform rounded-full bg-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-purple-700"
              >
                Plan an Event
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap justify-center gap-8 lg:justify-start">
              <div className="text-center">
                <div className="brand-text-gradient text-4xl font-bold">
                  10K+
                </div>
                <p className="font-medium text-gray-600">Happy Users</p>
              </div>
              <div className="text-center">
                <div className="brand-text-gradient text-4xl font-bold">
                  500+
                </div>
                <p className="font-medium text-gray-600">Trusted Vendors</p>
              </div>
              <div className="text-center">
                <div className="brand-text-gradient text-4xl font-bold">
                  5K+
                </div>
                <p className="font-medium text-gray-600">Events Planned</p>
              </div>
            </div>
          </div>

          {/* Right Column (The glass card) */}
          <div className="relative">
            <div className="vendor-card rounded-2xl border border-white/20 bg-white/50 p-4 shadow-2xl backdrop-blur-lg">
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src="https://placehold.co/600x400/d8b4fe/3730a3?text=Sunset+Gardens"
                  alt="Sunset Gardens"
                  className="h-full w-full object-cover"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-4 right-4 flex items-center space-x-1 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-yellow-500 backdrop-blur-sm">
                  <span>★</span> {/* Placeholder for icon */}
                  <span>4.9</span>
                </div>
                <div className="absolute right-4 bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">Sunset Gardens</h3>
                  <div className="mt-1 flex items-center text-sm">
                    <span className="rounded-full bg-purple-500 px-2 py-0.5">
                      Venue
                    </span>
                    <span className="ml-2">
                      <span className="mr-1">📍</span>{" "}
                      {/* Placeholder for icon */}
                      Port Harcourt, Nigeria
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Breathtaking venues for unforgettable celebrations.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href="#"
                    className="font-semibold text-purple-600 hover:underline"
                  >
                    View Profile
                  </Link>
                  <Link
                    href="#"
                    className="rounded-full bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700"
                  >
                    Book Now
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
