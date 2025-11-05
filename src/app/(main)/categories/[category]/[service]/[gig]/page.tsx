"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  ChevronRight,
  Home,
  ChevronDown,
  Star,
  Heart,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
  Check,
  Clock,
  RefreshCw,
  Share2,
  MoreVertical,
  MapPin,
  Globe,
  Calendar,
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const gigDetails = {
  category: "Music & DJs",
  service: "Wedding DJs",
  categorySlug: "music-djs",
  serviceSlug: "wedding-djs",
  title: "I will be the professional wedding DJ for your reception",
  seller: {
    name: "DJ SpinMaster",
    level: "Level 2",
    rating: 4.9,
    reviews: 131,
    avatarUrl: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
    location: "Lagos, Nigeria",
    WillingToTravel: "Yes",
  },
  images: [
    "https://placehold.co/600x400/ec4899/ffffff?text=Wedding+DJ+1",
    "https://placehold.co/600x400/7c3aed/ffffff?text=My+Setup",
    "https://placehold.co/600x400/3b82f6/ffffff?text=Past+Event",
    "https://placehold.co/600x400/ef4444/ffffff?text=Dance+Floor",
    "https://placehold.co/600x400/10b981/ffffff?text=Happy+Couple",
  ],
  about:
    "Get the party started with a professional DJ experience! I have over 5 years of experience playing at weddings, corporate events, and private parties across Lagos and Abuja. I'll work with you to create the perfect playlist and keep your guests on the dance floor all night long. My setup is professional, and my music library is vast, covering everything from Afrobeats and Highlife to Pop, Hip Hop, and classic wedding anthems.",

  // FIX: Replaced 'packages' with 'basePrice' and 'basePriceIncludes'
  basePrice: 150000,
  basePriceIncludes: [
    "4 hours of DJ service",
    "Professional sound system",
    "MC services",
    "1 playlist consultation",
  ],
  // NEW: Added Add-ons data
  addOns: [
    { title: "Extra Hour", price: 25000 },
    { title: "Dance Floor Lighting", price: 40000 },
    { title: "Ceremony Audio Setup", price: 30000 },
  ],
};
// --- End Mock Data ---

// --- Main Page Component ---
const GigDetailPage = () => {
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

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
      const sidebarRect = sidebarEl.getBoundingClientRect();
      const contentBottom = contentRect.bottom + window.scrollY - topOffset;
      const sidebarHeight = sidebarEl.offsetHeight;
      const stickyTop = document.documentElement.scrollTop + topOffset;

      const startStickyOffset = contentEl.offsetTop;

      if (stickyTop > startStickyOffset) {
        setIsSidebarSticky(true);
      } else {
        setIsSidebarSticky(false);
      }

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
    <div className="min-h-screen bg-white pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex flex-wrap items-center text-sm text-gray-500">
          <a href="/" className="hover:text-pink-600">
            <Home className="h-4 w-4" />
          </a>
          <ChevronRight className="mx-1 h-4 w-4" />
          <a
            href={`/categories/${gigDetails.categorySlug}`}
            className="hover:text-pink-600"
          >
            {gigDetails.category}
          </a>
          <ChevronRight className="mx-1 h-4 w-4" />
          <a
            href={`/categories/${gigDetails.categorySlug}/${gigDetails.serviceSlug}`}
            className="hover:text-pink-600"
          >
            {gigDetails.service}
          </a>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2" ref={contentRef}>
            <GigTitleBar />
            <h2 className="mb-4 text-2xl font-bold text-gray-800 lg:hidden">
              Portfolio & Gallery
            </h2>
            <GigImageCarousel images={gigDetails.images} />

            {/* FIX: Booking Card for Mobile */}
            <div className="mb-12 lg:hidden">
              <BookingCard />
            </div>

            <GigAbout />
            <GigSellerInfo />
            <GigReviews />
          </div>

          {/* Right Column (Sticky Sidebar) */}
          <div className="relative hidden lg:col-span-1 lg:block">
            <div
              ref={sidebarRef}
              className={cn(
                "w-full transition-all duration-100",
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
              {/* FIX: Renamed PricingCard to BookingCard */}
              <BookingCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Left Column Components ---

const GigTitleBar = () => (
  <div className="mb-6">
    <h1 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
      {gigDetails.title}
    </h1>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <img
        src={gigDetails.seller.avatarUrl}
        alt={gigDetails.seller.name}
        className="h-10 w-10 rounded-full"
      />
      <span className="text-lg font-semibold">{gigDetails.seller.name}</span>
      <span className="hidden text-sm text-gray-500 sm:inline">|</span>
      <span className="text-sm text-gray-500">{gigDetails.seller.level}</span>
      <div className="flex items-center gap-1">
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <span className="font-bold text-yellow-500">
          {gigDetails.seller.rating}
        </span>
        <span className="text-sm text-gray-500">
          ({gigDetails.seller.reviews} reviews)
        </span>
      </div>
    </div>
    {/* NEW: Event-specific details */}
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600">
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span>
          Based in <strong>{gigDetails.seller.location}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Globe className="h-4 w-4 text-gray-500" />
        <span>
          Willing to travel:{" "}
          <strong>{gigDetails.seller.WillingToTravel}</strong>
        </span>
      </div>
    </div>
  </div>
);

const GigImageCarousel = ({ images }: { images: string[] }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () =>
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () =>
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  return (
    <div className="mb-8">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <img
          src={images[currentImage]}
          alt="Gig preview"
          className="h-full w-full object-cover"
        />
        <button
          onClick={prevImage}
          className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white"
        >
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <button
          onClick={nextImage}
          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white"
        >
          <ChevronRight className="h-6 w-6 text-gray-800" />
        </button>
      </div>
      {/* NEW: Thumbnails */}
      <div className="mt-2 flex space-x-2 overflow-x-auto pb-2">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={cn(
              "h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border-2",
              currentImage === index ? "border-pink-600" : "border-transparent",
            )}
          >
            <img
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const GigAbout = () => (
  <div className="mb-12">
    <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
      About this gig
    </h2>
    <p className="text-base leading-relaxed whitespace-pre-line text-gray-600">
      {gigDetails.about}
    </p>
  </div>
);

const GigSellerInfo = () => (
  <div className="mb-12">
    <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
      About the seller
    </h2>
    {/* FIX: Stack vertically on mobile */}
    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:space-x-4">
      <img
        src={gigDetails.seller.avatarUrl}
        alt={gigDetails.seller.name}
        className="mb-4 h-20 w-20 rounded-full sm:mb-0"
      />
      <div>
        <h3 className="text-xl font-semibold">{gigDetails.seller.name}</h3>
        <p className="text-gray-500">{gigDetails.seller.level}</p>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-5 w-5 fill-current text-yellow-400" />
          <span className="font-bold text-yellow-500">
            {gigDetails.seller.rating}
          </span>
          <span className="text-sm text-gray-500">
            ({gigDetails.seller.reviews})
          </span>
        </div>
      </div>
    </div>
    <div className="mt-6 rounded-lg border p-6">
      <p className="text-gray-600">
        From Lagos, Nigeria. Avg. response time: 1 Hour.
      </p>
      <p className="mt-4 text-gray-600">
        Verified professional DJ with 5+ years of experience. Let's make your
        event unforgettable!
      </p>
      <button className="mt-6 w-full rounded-md border border-gray-700 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100">
        Contact me
      </button>
    </div>
  </div>
);

const GigReviews = () => (
  <div className="mb-12">
    <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
      Reviews
    </h2>
    {/* A single mock review */}
    <div className="border-b py-6">
      <div className="mb-3 flex items-center space-x-3">
        <img
          src="https://placehold.co/40x40/eee/333?text=A"
          alt="Reviewer"
          className="h-10 w-10 rounded-full"
        />
        <div>
          <h4 className="font-semibold">Adebayo P.</h4>
          <p className="text-sm text-gray-500">Nigeria</p>
        </div>
      </div>
      <div className="mb-3 flex items-center gap-1">
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <span className="ml-2 font-bold text-yellow-500">5.0</span>
        <span className="ml-2 text-sm text-gray-400">2 weeks ago</span>
      </div>
      <p className="leading-relaxed text-gray-600">
        DJ SpinMaster was amazing! He kept the dance floor full all night and
        was so professional to work with. Highly recommend for any wedding!
      </p>
    </div>
    {/* ... more reviews would go here ... */}
  </div>
);

// --- Right Column Components ---

// FIX: Renamed from PricingCard to BookingCard and simplified
const BookingCard = () => {
  return (
    <div className="rounded-lg border border-gray-200 shadow-sm">
      {/* REMOVED: Tabs */}

      {/* Content */}
      <div className="p-6">
        {/* NEW: Date Picker */}
        <div className="mb-5">
          <label
            htmlFor="event-date"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Check Availability
          </label>
          <div className="relative">
            <input
              type="date"
              id="event-date"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-pink-500"
              defaultValue={new Date().toISOString().split("T")[0]} // Today's date
            />
            <Calendar className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* FIX: Simplified Price */}
        <div className="mb-4 flex items-baseline">
          <span className="text-sm text-gray-500">Starting at</span>
          <span className="ml-2 text-3xl font-bold text-gray-900">
            ₦{gigDetails.basePrice.toLocaleString()}
          </span>
        </div>

        {/* FIX: Base Offer (Base Conditions) */}
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-gray-800">
            What's Included (Base Offer):
          </h4>
          <ul className="space-y-3">
            {gigDetails.basePriceIncludes.map((feature: string) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* NEW: Display Add-ons */}
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-gray-800">
            Available Add-ons:
          </h4>
          <ul className="space-y-2">
            {gigDetails.addOns.map((addon) => (
              <li
                key={addon.title}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{addon.title}</span>
                <span className="font-semibold text-gray-700">
                  + ₦{addon.price.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* FIX: Updated button text to match flow */}
        <button className="w-full rounded-md bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700">
          Request Quote
        </button>
        <button className="mt-3 w-full rounded-md border border-gray-700 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100">
          Chat with Seller
        </button>
      </div>
    </div>
  );
};

export default GigDetailPage;
