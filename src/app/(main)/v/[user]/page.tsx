"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  Heart,
  MapPin,
  Languages,
  Award,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type vendor = routerOutput["vendor"]["getByUsername"];
type gig = routerOutput["gig"]["getByVendorUsername"][number];

// --- Main Page Component ---
const VendorProfilePage = () => {
  const params = useParams();
  const username = params.user as string;
  const router = useRouter();
  const { user } = useAuth();

  // Fetch vendor profile and gigs
  const {
    data: vendorProfile,
    isLoading: vendorLoading,
    error: vendorError,
  } = api.vendor.getByUsername.useQuery({ username });
  const { data: gigs, isLoading: gigsLoading } =
    api.gig.getByVendorUsername.useQuery({ username });

  // Create conversation mutation
  const createConversation = api.chat.createConversationWithMessage.useMutation(
    {
      onSuccess: (data) => {
        router.push(`/inbox?conversation=${data.conversationId}`);
      },
      onError: (error) => {
        console.error("Failed to create conversation:", error);
        alert("Please sign in to contact this vendor");
      },
    },
  );

  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      // const sidebarRect = sidebarEl.getBoundingClientRect();

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

  const handleContactVendor = () => {
    if (!user) {
      alert("Please sign in to contact this vendor");
      return;
    }

    if (!vendorProfile?.userId) {
      alert("Unable to contact this vendor");
      return;
    }

    // Prevent contacting yourself
    if (user.id === vendorProfile.userId) {
      alert("You cannot message yourself");
      return;
    }

    createConversation.mutate({
      otherUserId: vendorProfile.userId,
      initialMessage: `Hi! I'd like to know more about your services.`,
    });
  };

  if (vendorError) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-xl font-bold text-red-800">Vendor Not Found</h2>
            <p className="mt-2 text-red-600">
              The vendor profile you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    );
  }

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
              <StickySellerInfoCard
                vendorProfile={vendorProfile ?? ({} as vendor)}
                onContactClick={handleContactVendor}
                isCreatingConversation={createConversation.isPending}
              />
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
              <StickySellerInfoCard
                vendorProfile={vendorProfile ?? ({} as vendor)}
                onContactClick={handleContactVendor}
                isCreatingConversation={createConversation.isPending}
              />
            </div>
          </div>

          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-2" ref={contentRef}>
            <MyGigsSection gigs={gigs} isLoading={gigsLoading} />
            <ReviewsSection vendorProfile={vendorProfile ?? ({} as vendor)} />
          </div>
        </div>
      </div>

      {/* Innovation: Floating Chat Button */}
      <button
        onClick={handleContactVendor}
        disabled={createConversation.isPending}
        className="fixed bottom-6 left-6 z-20 rounded-full bg-pink-600 p-4 text-white shadow-lg transition-transform hover:scale-105 hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50 lg:bottom-10 lg:left-10"
      >
        {createConversation.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

// --- Sub-Components ---

const StickySellerInfoCard = ({
  vendorProfile,
  onContactClick,
  isCreatingConversation,
}: {
  vendorProfile: vendor;
  onContactClick: () => void;
  isCreatingConversation: boolean;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center">
      <Image
        src={
          vendorProfile?.avatarUrl ??
          "https://placehold.co/128x128/ec4899/ffffff?text=V"
        }
        alt={vendorProfile?.companyName ?? "Vendor"}
        className="mb-4 h-32 w-32 rounded-full"
        width={128}
        height={128}
      />
      <h1 className="text-2xl font-bold text-gray-800">
        {vendorProfile?.companyName ?? "Vendor"}
      </h1>
      <p className="text-center text-gray-600">
        {vendorProfile?.title ?? "Service Provider"}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <span className="font-bold text-yellow-500">
          {vendorProfile?.rating?.toFixed(1) ?? "0.0"}
        </span>
        <span className="mx-1 hidden text-gray-300 sm:inline">|</span>
        <Award className="h-5 w-5 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">
          {vendorProfile?.level ?? "Level 0"}
        </span>
      </div>
    </div>

    <div className="mt-6">
      {/* FIX: Changed to "Request Quote" to match event flow */}
      <button
        onClick={onContactClick}
        disabled={isCreatingConversation}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreatingConversation ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Starting conversation...</span>
          </>
        ) : (
          "Request Quote"
        )}
      </button>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col space-y-3">
        {vendorProfile?.location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-5 w-5 shrink-0 text-gray-500" />
            <span>
              From <strong>{vendorProfile.location}</strong>
            </span>
          </div>
        )}
        {vendorProfile?.languages && vendorProfile.languages.length > 0 && (
          <div className="flex items-start gap-3 text-sm">
            <Languages className="h-5 w-5 shrink-0 text-gray-500" />
            <span>
              Speaks <strong>{vendorProfile.languages.join(", ")}</strong>
            </span>
          </div>
        )}
        {vendorProfile?.avgResponseTime && (
          <div className="flex items-start gap-3 text-sm">
            <Clock className="h-5 w-5 shrink-0 text-gray-500" />
            <span>
              Avg. response time:{" "}
              <strong>{vendorProfile.avgResponseTime}</strong>
            </span>
          </div>
        )}
      </div>
    </div>

    {vendorProfile?.about && (
      <div className="mt-6 border-t pt-6">
        <h3 className="mb-3 text-lg font-semibold">About me</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
          {vendorProfile.about}
        </p>
      </div>
    )}

    {vendorProfile?.skills && vendorProfile.skills.length > 0 && (
      <div className="mt-6 border-t pt-6">
        <h3 className="mb-4 text-lg font-semibold">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {vendorProfile.skills.map((skill: string) => (
            <span
              key={skill}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const MyGigsSection = ({
  gigs,
  isLoading,
}: {
  gigs?: gig[] | undefined;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      </div>
    );
  }

  if (!gigs || gigs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Gigs</h2>
        <p className="py-8 text-center text-gray-500">No gigs available yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Gigs ({gigs.length})
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {gigs.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))}
      </div>
    </div>
  );
};

const ReviewsSection = ({ vendorProfile }: { vendorProfile: vendor }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-2xl font-bold text-gray-800">Reviews</h2>
    <div className="py-8 text-center">
      <Star className="mx-auto mb-2 h-12 w-12 text-gray-300" />
      <p className="text-gray-500">No reviews yet</p>
      <p className="mt-1 text-sm text-gray-400">
        Be the first to work with this vendor!
      </p>
    </div>
  </div>
);

const GigCard = ({ gig }: { gig: gig }) => {
  const firstImage =
    gig.galleryImageUrls?.[0] ??
    "https://placehold.co/400x300/ec4899/ffffff?text=Gig";
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <a href={`/gigs/${gig.id}`} className="group">
        {/* Image */}
        <div className="relative aspect-4/3 w-full overflow-hidden">
          <Image
            src={firstImage}
            alt={gig.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={300}
          />
          <button className="absolute top-3 right-3 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
            <Heart className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        <div className="p-4">
          {/* Title */}
          <p className="mb-1.5 h-12 overflow-hidden text-base text-gray-800 transition-colors hover:text-pink-600">
            {gig.title}
          </p>

          {/* Category */}
          <div className="mb-2 text-xs text-gray-500">
            {gig.service?.category?.name} • {gig.service?.name}
          </div>

          {/* Price */}
          <div>
            <span className="text-xs font-medium text-gray-500">FROM</span>
            <span className="ml-1.5 text-lg font-bold text-gray-900">
              ₦{gig.basePrice.toLocaleString()}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default VendorProfilePage;
