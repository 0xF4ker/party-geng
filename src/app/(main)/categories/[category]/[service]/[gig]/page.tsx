"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  ChevronRight,
  Home,
  Star,
  ChevronLeft,
  Check,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { notFound } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
type gig = routerOutput["gig"]["getById"];

// --- Main Page Component ---
const GigDetailPage = () => {
  const params = useParams();
  // const router = useRouter();
  const gigId = params?.gig as string;
  const categorySlug = params?.category as string;
  const serviceSlug = params?.service as string;

  // Fetch gig data
  const { data: gig, isLoading } = api.gig.getById.useQuery({ id: gigId });

  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // If gig not found after loading
  if (!isLoading && !gig) {
    notFound();
  }

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

  // Loading state
  if (isLoading || !gig) {
    return (
      <div className="min-h-screen bg-white pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    );
  }

  const categoryName = gig.service.category.name;
  const serviceName = gig.service.name;

  return (
    <div className="min-h-screen bg-white pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex flex-wrap items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-pink-600">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <Link
            href={`/categories/${categorySlug}`}
            className="hover:text-pink-600"
          >
            {categoryName}
          </Link>
          <ChevronRight className="mx-1 h-4 w-4" />
          <Link
            href={`/categories/${categorySlug}/${serviceSlug}`}
            className="hover:text-pink-600"
          >
            {serviceName}
          </Link>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2" ref={contentRef}>
            <GigTitleBar gig={gig ?? ({} as gig)} />
            <h2 className="mb-4 text-2xl font-bold text-gray-800 lg:hidden">
              Portfolio & Gallery
            </h2>
            <GigImageCarousel images={gig.galleryImageUrls} />

            {/* FIX: Booking Card for Mobile */}
            <div className="mb-12 lg:hidden">
              <BookingCard gig={gig} />
            </div>

            <GigAbout gig={gig} />
            <GigSellerInfo gig={gig} />
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
              <BookingCard gig={gig} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Left Column Components ---

const GigTitleBar = ({ gig }: { gig: gig }) => {
  const vendorName = gig?.vendor.user.username;
  const vendorLevel = gig?.vendor.level ?? "Level 0";
  const vendorRating = gig?.vendor.rating;
  const orderCount = gig?._count.orders;
  const vendorAvatar = gig?.vendor.avatarUrl;
  const vendorLocation = gig?.vendor.location ?? "Nigeria";

  return (
    <div className="mb-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
        {gig?.title}
      </h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Image
          src={
            vendorAvatar ??
            `https://placehold.co/40x40/ec4899/ffffff?text=${
              vendorName?.[0]?.toUpperCase() ?? "V"
            }`
          }
          alt={vendorName ?? "Vendor"}
          className="h-10 w-10 rounded-full"
          width={40}
          height={40}
        />
        <span className="text-lg font-semibold">{vendorName}</span>
        <span className="hidden text-sm text-gray-500 sm:inline">|</span>
        <span className="text-sm text-gray-500">{vendorLevel}</span>
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-current text-yellow-400" />
          <span className="font-bold text-yellow-500">
            {vendorRating?.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            {`(${(orderCount ?? 0) > 1000 ? "1k+" : (orderCount ?? 0)} orders)`}
          </span>
        </div>
      </div>
      {/* NEW: Event-specific details */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span>
            Based in <strong>{vendorLocation}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

const GigImageCarousel = ({ images }: { images: string[] }) => {
  const [currentImage, setCurrentImage] = useState(0);

  // Use placeholder if no images
  const displayImages =
    images.length > 0
      ? images
      : ["https://placehold.co/600x400/ec4899/ffffff?text=No+Image"];

  const nextImage = () =>
    setCurrentImage((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1,
    );
  const prevImage = () =>
    setCurrentImage((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1,
    );

  // Ensure src passed to Next/Image is always a string (fallback to first image or empty string)
  const safeSrc: string = displayImages[currentImage] ?? displayImages[0] ?? "";

  return (
    <div className="mb-8">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg">
        <Image
          src={safeSrc}
          alt="Gig preview"
          className="h-full w-full object-cover"
          fill
          priority
          height={400}
          width={600}
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
        {displayImages.map((img, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={cn(
              "h-14 w-20 shrink-0 overflow-hidden rounded-md border-2",
              currentImage === index ? "border-pink-600" : "border-transparent",
            )}
          >
            <Image
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className="h-full w-full object-cover"
              width={80}
              height={56}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const GigAbout = ({ gig }: { gig: gig }) => (
  <div className="mb-12">
    <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
      About this gig
    </h2>
    <p className="text-base leading-relaxed whitespace-pre-line text-gray-600">
      {gig?.description}
    </p>
  </div>
);

const GigSellerInfo = ({ gig }: { gig: gig }) => {
  if (!gig) return null;
  const vendorName = gig.vendor.user.username;
  const vendorLevel = gig.vendor.level ?? "Level 0";
  const vendorRating = gig.vendor.rating;
  const orderCount = gig._count.orders;
  const vendorAvatar = gig.vendor.avatarUrl;
  const vendorLocation = gig.vendor.location ?? "Nigeria";
  const vendorAbout = gig.vendor.about;
  const avgResponseTime = gig.vendor.avgResponseTime ?? "N/A";

  return (
    <div className="mb-12">
      <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
        About the seller
      </h2>
      {/* FIX: Stack vertically on mobile */}
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:space-x-4">
        <Image
          src={
            vendorAvatar ??
            `https://placehold.co/80x80/ec4899/ffffff?text=${vendorName[0]?.toUpperCase()}`
          }
          alt={vendorName}
          className="mb-4 h-20 w-20 rounded-full sm:mb-0"
          width={80}
          height={80}
        />
        <div>
          <h3 className="text-xl font-semibold">{vendorName}</h3>
          <p className="text-gray-500">{vendorLevel}</p>
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-5 w-5 fill-current text-yellow-400" />
            <span className="font-bold text-yellow-500">
              {vendorRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({orderCount > 1000 ? "1k+" : orderCount})
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-lg border p-6">
        <p className="text-gray-600">
          From {vendorLocation}. Avg. response time: {avgResponseTime}.
        </p>
        {vendorAbout && (
          <p className="mt-4 whitespace-pre-line text-gray-600">
            {vendorAbout}
          </p>
        )}
        <ContactVendorButton vendorId={gig.vendor.userId} gigId={gig.id} />
      </div>
    </div>
  );
};

const GigReviews = () => (
  <div className="mb-12">
    <h2 className="mb-4 border-b pb-2 text-2xl font-bold text-gray-800">
      Reviews
    </h2>
    {/* A single mock review */}
    <div className="border-b py-6">
      <div className="mb-3 flex items-center space-x-3">
        <Image
          src="https://placehold.co/40x40/eee/333?text=A"
          alt="Reviewer"
          className="h-10 w-10 rounded-full"
          width={40}
          height={40}
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

// Contact Vendor Button Component
const ContactVendorButton = ({
  vendorId,
  gigId,
}: {
  vendorId: string;
  gigId: string;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createConversation = api.chat.createConversationWithMessage.useMutation(
    {
      onSuccess: (data) => {
        router.push(`/inbox?conversation=${data.conversationId}`);
      },
    },
  );

  const handleContact = () => {
    if (!user) {
      alert("Please sign in to contact the vendor");
      return;
    }

    if (user.id === vendorId) {
      alert("You cannot contact yourself");
      return;
    }

    setIsCreating(true);
    createConversation.mutate({
      otherUserId: vendorId,
      initialMessage: `Hi! I'm interested in your service. Can we discuss the details?`,
      gigId,
    });
  };

  return (
    <button
      onClick={handleContact}
      disabled={isCreating || createConversation.isPending}
      className="mt-6 w-full rounded-md border border-gray-700 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
    >
      {isCreating || createConversation.isPending ? (
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      ) : (
        "Contact me"
      )}
    </button>
  );
};

// FIX: Renamed from PricingCard to BookingCard and simplified
const BookingCard = ({ gig }: { gig: gig }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  if (!gig) return null;

  const createConversation = api.chat.createConversationWithMessage.useMutation(
    {
      onSuccess: (data) => {
        router.push(`/inbox?conversation=${data.conversationId}`);
      },
    },
  );

  const handleRequestQuote = () => {
    if (!user) {
      alert("Please sign in to request a quote");
      return;
    }

    if (user.id === gig.vendor.userId) {
      alert("You cannot request a quote from yourself");
      return;
    }

    setIsRequestingQuote(true);
    createConversation.mutate({
      otherUserId: gig.vendor.userId,
      initialMessage: `Hi! I would like to request a quote for ${gig.title}. Can you provide more details?`,
      gigId: gig.id,
    });
  };

  const handleChatWithSeller = () => {
    if (!user) {
      alert("Please sign in to chat with the seller");
      return;
    }

    if (user.id === gig.vendor.userId) {
      alert("You cannot chat with yourself");
      return;
    }

    createConversation.mutate({
      otherUserId: gig.vendor.userId,
      initialMessage: `Hi! I'm interested in ${gig.title}. Are you available for my event?`,
      gigId: gig.id,
    });
  };

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
            ₦{gig.basePrice.toLocaleString()}
          </span>
        </div>

        {/* FIX: Base Offer (Base Conditions) */}
        <div className="mb-6">
          <h4 className="mb-2 font-semibold text-gray-800">
            What&apos;s Included (Base Offer):
          </h4>
          <ul className="space-y-3">
            {gig.basePriceIncludes.map((feature: string) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* NEW: Display Add-ons */}
        {gig.addOns && gig.addOns.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-2 font-semibold text-gray-800">
              Available Add-ons:
            </h4>
            <ul className="space-y-2">
              {gig.addOns.map((addon) => (
                <li
                  key={addon.id}
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
        )}

        {/* FIX: Updated button text to match flow */}
        <button
          onClick={handleRequestQuote}
          disabled={isRequestingQuote || createConversation.isPending}
          className="w-full rounded-md bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {isRequestingQuote || createConversation.isPending ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            "Request Quote"
          )}
        </button>
        <button
          onClick={handleChatWithSeller}
          disabled={createConversation.isPending}
          className="mt-3 w-full rounded-md border border-gray-700 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          {createConversation.isPending ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            "Chat with Seller"
          )}
        </button>
      </div>
    </div>
  );
};

export default GigDetailPage;
