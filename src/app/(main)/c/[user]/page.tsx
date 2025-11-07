"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  Check,
  MapPin,
  MessageSquare,
  // Image as ImageIcon,
  Calendar,
  Gift, // Added Gift icon
} from "lucide-react";
import Image from "next/image";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const clientDetails = {
  name: "Adebayo P.",
  avatarUrl: "https://placehold.co/128x128/3b82f6/ffffff?text=A",
  location: "Lagos, Nigeria",
  memberSince: "Joined July 2024",
  stats: {
    eventsHosted: 3,
    vendorsHired: 5,
  },
};

// RE-ADDED: Public upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Adebayo's 30th Birthday Bash",
    date: "December 15, 2025",
    status: "Public - Seeking Vendors",
    coverImage:
      "https://placehold.co/600x300/ec4899/ffffff?text=30th+Birthday+Bash",
    wishlistCount: 12, // Updated to be item count
    hiredVendors: [
      {
        id: 1,
        name: "DJ SpinMaster",
        avatarUrl: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
      },
      {
        id: 2,
        name: "SnapPro",
        avatarUrl: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
      },
    ],
  },
];

const pastEvents = [
  {
    id: 2,
    title: "End of Year Corporate Party 2024",
    date: "December 20, 2024",
    gallery: [
      "https://placehold.co/400x300/8b5cf6/ffffff?text=Corporate+1",
      "https://placehold.co/400x300/8b5cf6/ffffff?text=Corporate+2",
      "https://placehold.co/400x300/8b5cf6/ffffff?text=Corporate+3",
    ],
  },
  {
    id: 3,
    title: "Chioma's Wedding",
    date: "October 26, 2024",
    gallery: [
      "https://placehold.co/400x300/10b981/ffffff?text=Wedding+1",
      "https://placehold.co/400x300/10b981/ffffff?text=Wedding+2",
      "https://placehold.co/400x300/10b981/ffffff?text=Wedding+3",
      "https://placehold.co/400x300/10b981/ffffff?text=Wedding+4",
    ],
  },
];

const vendorReviews = [
  {
    id: 1,
    vendorName: "DJ SpinMaster",
    vendorAvatar: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
    rating: 5,
    date: "1 month ago",
    comment:
      "Adebayo was a fantastic client! Clear communication, prompt payment, and a great crowd. A pleasure to work for. 5 stars!",
  },
  {
    id: 2,
    vendorName: "SnapPro",
    vendorAvatar: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
    rating: 5,
    date: "3 months ago",
    comment:
      "A true professional. Adebayo knew exactly what he wanted for his corporate event photography. Clear brief and respectful of our time. Highly recommend working with him.",
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const ClientProfilePage = () => {
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("upcoming"); // FIX: Default to 'upcoming' events

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

      const contentRect = contentEl.getBoundingClientRect();
      // const sidebarRect = sidebarEl.getBoundingClientRect();
      const contentBottom = contentRect.bottom + window.scrollY - topOffset;
      const sidebarHeight = sidebarEl.offsetHeight;
      const stickyTop = document.documentElement.scrollTop + topOffset;

      // Start sticky
      const startStickyOffset = contentEl.offsetTop;

      if (stickyTop > startStickyOffset) {
        setIsSidebarSticky(true);
      } else {
        setIsSidebarSticky(false);
      }

      // Stop sticky (bottom out)
      if (isSidebarSticky && stickyTop + sidebarHeight > contentBottom) {
        sidebarEl.style.transform = `translateY(${contentBottom - (stickyTop + sidebarHeight)}px)`;
      } else {
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
              <ClientInfoCard />
            </div>
            {/* Desktop View: Sticky Wrapper */}
            <div
              ref={sidebarRef}
              className={cn(
                "hidden w-full transition-all duration-100 lg:block",
                isSidebarSticky ? "fixed" : "relative",
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
              <ClientInfoCard />
            </div>
          </div>

          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-2" ref={contentRef}>
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-gray-200">
              {/* FIX: Re-added 'Upcoming Events' tab */}
              <TabButton
                title="Upcoming Events"
                isActive={activeTab === "upcoming"}
                onClick={() => setActiveTab("upcoming")}
              />
              <TabButton
                title="Past Events"
                isActive={activeTab === "past"}
                onClick={() => setActiveTab("past")}
              />
              <TabButton
                title="Reviews From Vendors"
                isActive={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
              />
            </div>

            {/* Tab Content */}
            <div>
              {/* FIX: Re-added 'upcoming' tab content */}
              {activeTab === "upcoming" && <UpcomingEventsSection />}
              {activeTab === "past" && <PastEventsSection />}
              {activeTab === "reviews" && <ReviewsFromVendorsSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const ClientInfoCard = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center">
      <Image
        src={clientDetails.avatarUrl}
        alt={clientDetails.name}
        className="mb-4 h-32 w-32 rounded-full"
        width={128}
        height={128}
      />
      <h1 className="text-2xl font-bold text-gray-800">{clientDetails.name}</h1>
      <div className="mt-1 flex items-center gap-2">
        <Check className="h-5 w-5 rounded-full bg-green-500 p-0.5 text-white" />
        <span className="text-sm font-semibold text-green-600">
          Verified Client
        </span>
      </div>
    </div>

    {/* FIX: Changed button to "Message Client" */}
    <div className="mt-6 border-t pt-6">
      <button className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700">
        <MessageSquare className="h-5 w-5" />
        Message Client
      </button>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex items-center justify-around text-center">
        <div>
          <p className="text-2xl font-bold">
            {clientDetails.stats.eventsHosted}
          </p>
          <p className="text-sm text-gray-500">Events Hosted</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {clientDetails.stats.vendorsHired}
          </p>
          <p className="text-sm text-gray-500">Hires Made</p>
        </div>
      </div>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="h-5 w-5 shrink-0 text-gray-500" />
          <span>
            From <strong>{clientDetails.location}</strong>
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="h-5 w-5 shrink-0 text-gray-500" />
          <span>{clientDetails.memberSince}</span>
        </div>
      </div>
    </div>
  </div>
);

const TabButton = ({
  title,
  isActive,
  onClick,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-1 py-3 text-sm font-semibold transition-colors sm:px-4 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {title}
  </button>
);

// FIX: Re-added UpcomingEventsSection component
const UpcomingEventsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 lg:hidden">
      Upcoming Events
    </h2>
    {upcomingEvents.map((event) => (
      <div
        key={event.id}
        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        <Image
          src={event.coverImage}
          alt={event.title}
          className="h-40 w-full object-cover"
          width={600}
          height={200}
        />
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600">
                {event.status}
              </p>
              <h3 className="mt-1 text-xl font-bold text-gray-800">
                {event.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Event Date: {event.date}
              </p>
            </div>
            {/* Removed Edit button, this is a public view */}
          </div>
          {/* FIX: Changed "Hired Vendors" to "Wishlist" */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-3 text-center text-sm text-gray-600">
              🎁 This event has a public wishlist with {event.wishlistCount}{" "}
              items!
            </p>
            <button className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-pink-700">
              <Gift className="h-5 w-5" />
              View Event Wishlist
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const PastEventsSection = () => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold text-gray-800 lg:hidden">Past Events</h2>
    {pastEvents.map((event) => (
      <div
        key={event.id}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm font-semibold text-gray-500">{event.date}</p>
        <h3 className="mt-1 mb-4 text-xl font-bold text-gray-800">
          {event.title}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {event.gallery.map((imgUrl, index) => (
            <div
              key={index}
              className="aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={imgUrl}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
                width={400}
                height={300}
              />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ReviewsFromVendorsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800 lg:hidden">
      Reviews From Vendors
    </h2>
    {vendorReviews.map((review) => (
      <div
        key={review.id}
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-3 flex items-center space-x-3">
          <Image
            src={review.vendorAvatar}
            alt={review.vendorName}
            className="h-10 w-10 rounded-full"
            width={40}
            height={40}
          />
          <div>
            <h4 className="font-semibold">{review.vendorName}</h4>
            <p className="text-sm text-gray-500">Verified Vendor</p>
          </div>
        </div>
        <div className="mb-3 flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => i).map((i) => (
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
        <p className="leading-relaxed text-gray-600">
          &quot;{review.comment}&quot;
        </p>
      </div>
    ))}
  </div>
);

export default ClientProfilePage;
