"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Languages,
  Award,
  MessageSquare,
  Clock,
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const vendorDetails = {
  name: "DJ SpinMaster",
  handle: "@djspinmaster",
  level: "Level 2",
  title: "Professional Wedding & Event DJ",
  rating: 4.9,
  reviews: 131,
  avatarUrl: "https://placehold.co/128x128/ec4899/ffffff?text=DJ",
  location: "Lagos, Nigeria",
  languages: ["English", "Yoruba", "Pidgin"],
  avgResponseTime: "1 Hour",
  about:
    "Hi everyone, let me introduce myself. My name is DJ SpinMaster, and I am a professional event DJ with over 5 years of experience.\n\nI love creating unforgettable atmospheres for weddings, corporate events, and private parties. I specialize in Afrobeats, Amapiano, Hip Hop, and classic party anthems. Let's work together to make your event amazing!",
  skills: [
    "Wedding DJ",
    "Corporate Events",
    "MC",
    "Afrobeats",
    "Amapiano",
    "Playlist Curation",
    "Sound Engineering",
  ],
};

const gigsData = [
  {
    id: 1,
    sellerName: "DJ SpinMaster",
    level: "Level 2",
    description: "I will be the professional wedding DJ for your reception",
    rating: 4.9,
    reviews: 131,
    price: 150000,
    imageUrl: "https://placehold.co/400x300/ec4899/ffffff?text=Wedding+DJ",
    isFeatured: false, // Removed featured concept
  },
  {
    id: 2,
    sellerName: "DJ SpinMaster",
    level: "Level 2",
    description: "I will provide premium DJ services for corporate events",
    rating: 4.9,
    reviews: 131,
    price: 400000,
    imageUrl: "https://placehold.co/400x300/ef4444/ffffff?text=Corporate+DJ",
  },
  {
    id: 3,
    sellerName: "DJ SpinMaster",
    level: "Level 2",
    description: "I will DJ your birthday party with Afrobeats & Amapiano",
    rating: 4.9,
    reviews: 131,
    price: 100000,
    imageUrl: "https://placehold.co/400x300/3b82f6/ffffff?text=Birthday+Party",
  },
  {
    id: 4,
    sellerName: "DJ SpinMaster",
    level: "Level 2",
    description: "I will provide full sound system rental for your event",
    rating: 4.9,
    reviews: 131,
    price: 80000,
    imageUrl: "https://placehold.co/400x300/10b981/ffffff?text=Sound+System",
  },
];

const reviewData = [
  {
    id: 1,
    reviewerName: "Adebayo P.",
    location: "Nigeria",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "DJ SpinMaster was amazing! He kept the dance floor full all night and was so professional to work with. Highly recommend for any wedding!",
    avatarUrl: "https://placehold.co/40x40/eee/333?text=A",
  },
  {
    id: 2,
    reviewerName: "Chioma E.",
    location: "Nigeria",
    rating: 5,
    date: "1 month ago",
    comment:
      "Booked for our corporate end-of-year party. Punctual, great music selection, and read the crowd perfectly. Will book again.",
    avatarUrl: "https://placehold.co/40x40/eee/333?text=C",
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const VendorProfilePage = () => {
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null); // Ref for the right-side content

  // Effect to capture sidebar width
  useLayoutEffect(() => {
    const sidebarEl = sidebarRef.current;
    if (sidebarEl && window.innerWidth >= 1024) {
      setSidebarWidth(sidebarEl.offsetWidth);
    }

    const handleResize = () => {
      if (sidebarEl && window.innerWidth >= 1024) {
        if (!isSidebarSticky) {
          sidebarEl.style.width = "auto"; // Reset to get natural width
        }
        setSidebarWidth(sidebarEl.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarSticky]);

  // Effect for sticky sidebar
  useEffect(() => {
    if (window.innerWidth < 1024) return; // Only run sticky logic on desktop

    const sidebarEl = sidebarRef.current;
    const contentEl = contentRef.current;
    if (!sidebarEl || !contentEl) return;

    const topOffset = 127; // Your header height

    const handleScroll = () => {
      if (!sidebarEl || !contentEl) return;

      // Use contentRef (right column) for calculations
      const contentRect = contentEl.getBoundingClientRect();
      const sidebarRect = sidebarEl.getBoundingClientRect();

      // Calculate the absolute bottom of the *content* area
      const contentBottom = contentRect.bottom + window.scrollY - topOffset;
      const sidebarHeight = sidebarEl.offsetHeight;
      const stickyTop = document.documentElement.scrollTop + topOffset;

      // Start sticky when the top of the *sidebar's original position* goes past the header
      // We'll use a placeholder or the content's top as a proxy
      const startStickyOffset = contentEl.offsetTop; // Original top of the content column

      if (stickyTop > startStickyOffset) {
        setIsSidebarSticky(true);
      } else {
        setIsSidebarSticky(false);
      }

      // Stop sticky (bottom out)
      if (isSidebarSticky && stickyTop + sidebarHeight > contentBottom) {
        // We've hit the bottom. Pin the sidebar to the bottom of the content area.
        sidebarEl.style.transform = `translateY(${contentBottom - (stickyTop + sidebarHeight)}px)`;
      } else {
        // We're either not sticky, or scrolling up from the bottom
        sidebarEl.style.transform = "translateY(0px)";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSidebarSticky]);

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column (Sticky Sidebar on Desktop) */}
          <div className="relative lg:col-span-1">
            {/* Mobile View: Static Card */}
            <div className="lg:hidden">
              <StickySellerInfoCard />
            </div>
            {/* Desktop View: Sticky Wrapper */}
            <div
              ref={sidebarRef}
              className={cn(
                "hidden w-full transition-all duration-100 lg:block",
                isSidebarSticky
                  ? "fixed" // Just 'fixed'
                  : "relative",
              )}
              style={
                isSidebarSticky
                  ? {
                      top: "127px",
                      width: `${sidebarWidth}px`, // Apply the saved width
                      transform: sidebarRef.current
                        ? sidebarRef.current.style.transform
                        : "translateY(0px)",
                    }
                  : {
                      width: "auto",
                      top: "auto",
                      transform: "translateY(0px)",
                    }
              }
            >
              <StickySellerInfoCard />
            </div>
          </div>

          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-2" ref={contentRef}>
            <MyGigsSection />
            <ReviewsSection />
          </div>
        </div>
      </div>

      {/* Innovation: Floating Chat Button */}
      <button className="fixed bottom-6 left-6 z-20 rounded-full bg-pink-600 p-4 text-white shadow-lg transition-transform hover:scale-105 hover:bg-pink-700 lg:bottom-10 lg:left-10">
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
};

// --- Sub-Components ---

const StickySellerInfoCard = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center">
      <img
        src={vendorDetails.avatarUrl}
        alt={vendorDetails.name}
        className="mb-4 h-32 w-32 rounded-full"
      />
      <h1 className="text-2xl font-bold text-gray-800">{vendorDetails.name}</h1>
      <p className="text-center text-gray-600">{vendorDetails.title}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <span className="font-bold text-yellow-500">
          {vendorDetails.rating}
        </span>
        <span className="text-sm text-gray-500">({vendorDetails.reviews})</span>
        <span className="mx-1 hidden text-gray-300 sm:inline">|</span>
        <Award className="h-5 w-5 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">
          {vendorDetails.level}
        </span>
      </div>
    </div>

    <div className="mt-6">
      {/* FIX: Changed to "Request Quote" to match event flow */}
      <button className="w-full rounded-md bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700">
        Request Quote
      </button>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            From <strong>{vendorDetails.location}</strong>
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Languages className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            Speaks <strong>{vendorDetails.languages.join(", ")}</strong>
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Clock className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            Avg. response time: <strong>{vendorDetails.avgResponseTime}</strong>
          </span>
        </div>
      </div>
    </div>

    <div className="mt-6 border-t pt-6">
      <h3 className="mb-3 text-lg font-semibold">About me</h3>
      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
        {vendorDetails.about}
      </p>
    </div>

    <div className="mt-6 border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Skills</h3>
      <div className="flex flex-wrap gap-2">
        {vendorDetails.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const MyGigsSection = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-6 text-2xl font-bold text-gray-800">My Gigs</h2>
    {/* FIX: Changed to a responsive grid */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {gigsData.map((gig) => (
        <GigCard key={gig.id} gig={gig} />
      ))}
    </div>
  </div>
);

{
  /* NEW: Reviews Section Component */
}
const ReviewsSection = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-2xl font-bold text-gray-800">
      Reviews ({reviewData.length})
    </h2>
    <div className="divide-y divide-gray-100">
      {reviewData.map((review) => (
        <div className="py-6" key={review.id}>
          <div className="mb-3 flex items-center space-x-3">
            <img
              src={review.avatarUrl}
              alt={review.reviewerName}
              className="h-10 w-10 rounded-full"
            />
            <div>
              <h4 className="font-semibold">{review.reviewerName}</h4>
              <p className="text-sm text-gray-500">{review.location}</p>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-5 w-5",
                  i < review.rating
                    ? "fill-current text-yellow-400"
                    : "text-gray-300",
                )}
              />
            ))}
            <span className="ml-2 font-bold text-yellow-500">
              {review.rating.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-gray-400">| {review.date}</span>
          </div>
          <p className="leading-relaxed text-gray-600">{review.comment}</p>
        </div>
      ))}
    </div>
  </div>
);

const GigCard = ({ gig }: { gig: any }) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <a href="#" className="group">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={gig.imageUrl}
            alt={gig.description}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button className="absolute top-3 right-3 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
            <Heart className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        <div className="p-4">
          {/* Description */}
          <p className="mb-1.5 h-12 overflow-hidden text-base text-gray-800 transition-colors hover:text-pink-600">
            {gig.description}
          </p>

          {/* Rating */}
          <div className="mb-2 flex items-center gap-1 text-sm text-gray-700">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span className="font-bold text-yellow-500">{gig.rating}</span>
            <span className="text-gray-400">({gig.reviews})</span>
          </div>

          {/* Price */}
          <div>
            <span className="text-xs font-medium text-gray-500">FROM</span>
            <span className="ml-1.5 text-lg font-bold text-gray-900">
              ₦{gig.price.toLocaleString()}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default VendorProfilePage;
