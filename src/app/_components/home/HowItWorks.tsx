"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Lock,
  CheckCircle,
  Search,
  Star,
  Send,
  MapPin,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- NEW: Animated Phone Mockup Component (Now auto-plays) ---
const AnimatedStepIllustration = () => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // This timer will cycle through the steps
    const timer = setTimeout(() => {
      setCurrentStep((prevStep) => (prevStep % 4) + 1); // Loops 1, 2, 3, 4, 1...
    }, 3000); // Change screen every 3 seconds

    return () => clearTimeout(timer);
  }, [currentStep]); // Re-run effect when currentStep changes

  return (
    <>
      <style>
        {`
          /* General fade transition for phone screens */
          .phone-screen {
            position: absolute;
            inset: 0;
            padding: 1.5rem 1rem; /* Padding inside the screen */
            background-color: #f9fafb; /* Light gray screen bg */
            border-radius: inherit; /* Inherit from parent */
            transition: opacity 0.7s ease-in-out; /* Fade transition */
            display: flex;
            flex-direction: column;
            overflow: hidden; /* Prevent content spillover */
          }

          /* Little animation for vendor cards */
           @keyframes card-slide-in {
             from { opacity: 0; transform: translateY(10px); }
             to { opacity: 1; transform: translateY(0); }
           }
           .vendor-card-anim {
             opacity: 0; /* Start hidden */
             animation: card-slide-in 0.4s ease-out forwards;
           }
           .vendor-card-anim:nth-child(1) { animation-delay: 0.1s; }
           .vendor-card-anim:nth-child(2) { animation-delay: 0.25s; }

          /* Chat bubble animation */
           @keyframes bubble-in {
              from { opacity: 0; transform: scale(0.8) translateY(5px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
           }
           .chat-bubble {
             opacity: 0;
             animation: bubble-in 0.3s ease-out forwards;
           }
           .chat-bubble:nth-child(1) { animation-delay: 0.2s; }
           .chat-bubble:nth-child(2) { animation-delay: 0.5s; }

           /* Payment animation */
            @keyframes pay-success {
              0% { transform: scale(0.8); opacity: 0;}
              70% { transform: scale(1.1); opacity: 1;}
              100% { transform: scale(1); opacity: 1;}
            }
            .pay-success-anim {
              opacity: 0;
              animation: pay-success 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              transform-origin: center;
            }

            /* Success animation */
             @keyframes success-pop {
               0% { transform: scale(0.7); opacity: 0; }
               100% { transform: scale(1); opacity: 1; }
             }
             .success-pop-anim {
               opacity: 0;
               animation: success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
             }
             
          /* Hide scrollbar */
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }

        `}
      </style>
      {/* Phone Mockup */}
      <div className="relative mx-auto h-[550px] w-[270px] rounded-[2.5rem] border-[10px] border-gray-800 bg-gray-800 shadow-xl dark:border-gray-800">
        <div className="absolute top-0 left-1/2 h-[18px] w-[140px] -translate-x-1/2 rounded-b-[1rem] bg-gray-800"></div>
        <div className="absolute top-[72px] -left-[13px] h-[32px] w-[3px] rounded-l-lg bg-gray-800"></div>
        <div className="absolute top-[124px] -left-[13px] h-[46px] w-[3px] rounded-l-lg bg-gray-800"></div>
        <div className="absolute top-[142px] -right-[13px] h-[46px] w-[3px] rounded-r-lg bg-gray-800"></div>
        <div className="h-full w-full overflow-hidden rounded-[2rem] bg-white dark:bg-gray-800">
          {/* Screen Content Area */}
          <div className="relative h-full w-full">
            {/* --- Step 1 Screen: Find Vendor --- */}
            <div
              className={cn(
                "phone-screen",
                currentStep === 1
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              {/* Search Bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search vendors (e.g., DJ)"
                  readOnly
                  className="w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm focus:outline-none"
                />
                <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {/* Vendor Cards */}
              <div className="scrollbar-hide space-y-3 overflow-y-auto">
                {/* Vendor Card 1 */}
                <div
                  className={cn(
                    "vendor-card-anim flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm",
                    currentStep === 1 ? "animate" : "",
                  )}
                >
                  <Image
                    src="https://placehold.co/60x60/ec4899/ffffff?text=DJ"
                    alt="DJ"
                    className="h-10 w-10 flex-shrink-0 rounded-md"
                    width={60}
                    height={60}
                  />
                  <div className="flex-grow">
                    <p className="text-sm font-semibold">DJ SpinMaster</p>
                    <div className="mt-0.5 flex items-center text-xs text-gray-500">
                      <MapPin className="mr-1 h-3 w-3" /> Lagos, NG{" "}
                      <Star className="mr-0.5 ml-2 h-3 w-3 fill-current text-yellow-400" />{" "}
                      4.9
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </div>
                {/* Vendor Card 2 */}
                <div
                  className={cn(
                    "vendor-card-anim flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm",
                    currentStep === 1 ? "animate" : "",
                  )}
                >
                  <Image
                    src="https://placehold.co/60x60/8b5cf6/ffffff?text=Cam"
                    alt="Photographer"
                    className="h-10 w-10 flex-shrink-0 rounded-md"
                    width={60}
                    height={60}
                  />
                  <div className="flex-grow">
                    <p className="text-sm font-semibold">Pixel Perfect Pics</p>
                    <div className="mt-0.5 flex items-center text-xs text-gray-500">
                      <MapPin className="mr-1 h-3 w-3" /> Abuja, NG{" "}
                      <Star className="mr-0.5 ml-2 h-3 w-3 fill-current text-yellow-400" />{" "}
                      5.0
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </div>
              </div>
            </div>

            {/* --- Step 2 Screen: Get Quote --- */}
            <div
              className={cn(
                "phone-screen",
                currentStep === 2
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <p className="mb-3 text-center text-xs text-gray-400">
                Today, 10:30 AM
              </p>
              <div className="scrollbar-hide flex-grow space-y-3 overflow-y-auto">
                {/* Message 1 (Client) */}
                <div
                  className={cn(
                    "chat-bubble flex justify-end",
                    currentStep === 2 ? "animate" : "",
                  )}
                >
                  <p className="max-w-[75%] rounded-lg rounded-br-none bg-pink-500 p-2.5 text-sm text-white">
                    Hi! Need a DJ for my birthday on Nov 15th. Are you
                    available?
                  </p>
                </div>
                {/* Message 2 (Vendor) */}
                <div
                  className={cn(
                    "chat-bubble flex justify-start",
                    currentStep === 2 ? "animate" : "",
                  )}
                >
                  <p className="max-w-[75%] rounded-lg rounded-bl-none bg-gray-200 p-2.5 text-sm text-gray-800">
                    Hey! Yes, I&apos;m available. My rate is ₦XXX for 4 hours.
                    Sending the official quote now. 👍
                  </p>
                </div>
              </div>
              {/* Input Area */}
              <div className="mt-auto flex items-center space-x-2 border-t border-gray-200 pt-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Type your message..."
                  className="flex-grow rounded-full border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm focus:outline-none"
                />
                <button className="rounded-full bg-pink-500 p-1.5 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* --- Step 3 Screen: Pay Securely --- */}
            <div
              className={cn(
                "phone-screen items-center justify-center text-center", // Centered content
                currentStep === 3
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div
                className={cn(
                  "pay-success-anim flex flex-col items-center",
                  currentStep === 3 ? "animate" : "",
                )}
              >
                <div className="mb-4 rounded-full bg-purple-100 p-4">
                  <Lock
                    className="h-12 w-12 text-purple-600"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  Payment Secured
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  ₦XXX has been held securely. Funds will be released to the
                  vendor after the gig.
                </p>
                <button className="mt-6 rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white">
                  View Booking
                </button>
              </div>
            </div>

            {/* --- Step 4 Screen: Event Success --- */}
            <div
              className={cn(
                "phone-screen items-center justify-center text-center", // Centered content
                currentStep === 4
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div
                className={cn(
                  "success-pop-anim flex flex-col items-center",
                  currentStep === 4 ? "animate" : "",
                )}
              >
                <div className="mb-4 rounded-full bg-green-100 p-4">
                  <CheckCircle
                    className="h-12 w-12 text-green-600"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  Event Success!
                </p>
                <p className="mt-1 mb-3 text-sm text-gray-500">
                  Payment released to DJ SpinMaster.
                </p>
                <div className="mb-4 flex space-x-1 text-yellow-400">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <button className="rounded-full bg-gray-800 px-5 py-2 text-sm font-semibold text-white">
                  Leave a Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Main Component ---
const HowItWorks = () => {
  // REMOVED: All state and useEffect logic for IntersectionObserver

  // Simplified steps for the horizontal diagram
  const simpleSteps = [
    {
      icon: Search,
      title: "Find Vendor",
      description:
        "Search or browse categories to find the perfect verified vendor.",
    },
    {
      icon: MessageSquare,
      title: "Get Quote",
      description: "Chat directly with vendors and receive an in-app quote.",
    },
    {
      icon: Lock,
      title: "Pay Securely",
      description: "Book your vendor by paying securely. We hold the funds.",
    },
    {
      icon: CheckCircle,
      title: "Event Success!",
      description:
        "Enjoy your event! Payment is released and you leave a review.",
    },
  ];

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Autoplay
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const interval = setInterval(() => {
      // Calculate next slide index
      const nextSlide = (activeSlide + 1) % simpleSteps.length;

      carousel.scrollTo({
        left: carousel.clientWidth * nextSlide,
        behavior: "smooth",
      });
      // We'll let the scroll listener update the active slide
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [activeSlide, simpleSteps.length]); // Rerun interval when activeSlide changes

  // Listen to scroll to update dots
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Function to handle scroll and update active dot
    const handleScroll = () => {
      const slideWidth = carousel.clientWidth;
      const newIndex = Math.round(carousel.scrollLeft / slideWidth);
      if (newIndex !== activeSlide) {
        setActiveSlide(newIndex);
      }
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
    // activeSlide is a dependency to ensure the listener always has the current slide index
  }, [activeSlide]);

  return (
    // FIX: Added gradient background, text-white, and custom clip-path class
    <section className="slanted-bottom relative bg-gradient-to-br from-pink-600 to-purple-700 py-24 text-white">
      <style>
        {`
          .slanted-bottom {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 6vw));
          }
          /* Ensure phone background remains light */
          .phone-screen {
            background-color: #f9fafb !important;
            color: #1f2937 !important; /* Reset text color inside phone */
          }
          .phone-screen .text-gray-400 { color: #9ca3af !important; }
          .phone-screen .text-gray-500 { color: #6b7280 !important; }
          .phone-screen .text-gray-800 { color: #1f2937 !important; }
          .phone-screen .bg-gray-100 { background-color: #f3f4f6 !important; }
          .phone-screen .bg-gray-200 { background-color: #e5e7eb !important; }
          .phone-screen .border-gray-200 { border-color: #e5e7eb !important; }
          .phone-screen .border-gray-300 { border-color: #d1d5db !important; }
        `}
      </style>
      <div className="container mx-auto grid grid-cols-1 items-center gap-16 px-4 lg:grid-cols-2">
        {/* --- Left Column: STATIC Text Content --- */}
        <div className="relative">
          {/* FIX: Adjusted text colors for dark background */}
          <h3 className="text-sm font-semibold text-pink-200 uppercase">
            How Partygeng Works
          </h3>
          <h2 className="mt-2 mb-8 text-3xl font-bold text-white md:text-4xl">
            A fully integrated platform for your events
          </h2>
          <p className="max-w-lg text-lg text-gray-100">
            Our platform streamlines the entire process, from finding the
            perfect vendor to secure payments and post-event reviews, all in one
            place.
          </p>

          {/* NEW: Carousel Steps Diagram */}
          <div className="mt-12">
            {/* Outer container for overflow and scroll snap */}
            <div
              ref={carouselRef}
              className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
            >
              {simpleSteps.map((step) => (
                // Each Slide
                <div
                  key={step.title}
                  className="w-full flex-shrink-0 snap-center" // Each slide takes full width
                >
                  <div className="flex flex-col items-center px-4 py-6 text-center">
                    {/* FIX: Adjusted icon colors for dark background */}
                    <div
                      className={cn(
                        "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300",
                        "bg-white/20 text-white", // Use light colors on dark bg
                      )}
                    >
                      <step.icon className="h-8 w-8" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 max-w-xs text-base text-gray-200">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots for carousel */}
            <div className="mt-6 flex justify-center space-x-3">
              {simpleSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (carouselRef.current) {
                      carouselRef.current.scrollTo({
                        left: carouselRef.current.clientWidth * index,
                        behavior: "smooth",
                      });
                    }
                    setActiveSlide(index); // Manually set for instant dot feedback
                  }}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all",
                    // FIX: Adjusted dot colors for dark background
                    activeSlide === index
                      ? "scale-125 bg-white"
                      : "bg-white/50",
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* --- Right Column: AUTO-PLAYING Animation --- */}
        <div className="flex items-center justify-center">
          <div className="h-[600px] w-full max-w-md">
            {" "}
            {/* Container for sizing */}
            <AnimatedStepIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
