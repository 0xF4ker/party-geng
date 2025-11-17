"use client";

import React, { useState } from "react";
import {
  Star,
  Languages,
  Clock,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import VendorProfileHeader from "@/app/_components/profile/VendorProfileHeader";

type routerOutput = inferRouterOutputs<AppRouter>;
type vendor = routerOutput["vendor"]["getByUsername"];

// --- Mock Data ---
const clientReviews = [
  {
    id: 1,
    clientName: "Adebayo",
    clientAvatar: "https://placehold.co/40x40/ec4899/ffffff?text=A",
    rating: 5,
    date: "1 month ago",
    comment:
      "DJ SpinMaster was absolutely phenomenal at our wedding! Kept the dance floor packed all night. Professional, energetic, and played all our requests. Highly recommend!",
  },
  {
    id: 2,
    clientName: "Funke",
    clientAvatar: "https://placehold.co/40x40/8d99ae/ffffff?text=F",
    rating: 4,
    date: "3 months ago",
    comment:
      "SnapPro did a great job with our corporate event photos. Very discreet and captured all the key moments. A few shots were slightly out of focus, but overall very happy.",
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const VendorProfilePage = () => {
  const params = useParams();
  const username = params.user as string;
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("about");

  const {
    data: vendorProfile,
    isLoading: vendorLoading,
    error: vendorError,
  } = api.vendor.getByUsername.useQuery({ username });

  const isOwnProfile = currentUser?.id === vendorProfile?.userId;

  if (vendorLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (vendorError || !vendorProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800">Profile Not Found</h2>
          <p className="mt-2 text-red-600">
            This vendor profile could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <VendorProfileHeader
        vendorProfile={vendorProfile}
        isOwnProfile={isOwnProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto max-w-4xl px-4">
        <div className="py-8">
          {activeTab === "about" && (
            <AboutSection vendorProfile={vendorProfile} />
          )}
          {activeTab === "reviews" && (
            <ReviewsSection reviews={clientReviews} />
          )}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const AboutSection = ({ vendorProfile }: { vendorProfile: vendor }) => (
  <div className="space-y-8 rounded-lg border border-gray-200 bg-white p-6">
    {vendorProfile?.about && (
      <div>
        <h3 className="mb-3 text-lg font-semibold">About Me</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
          {vendorProfile.about}
        </p>
      </div>
    )}

    {vendorProfile?.services && vendorProfile.services.length > 0 && (
      <div className="border-t pt-6">
        <h3 className="mb-4 text-lg font-semibold">Services Offered</h3>
        <div className="flex flex-wrap gap-2">
          {vendorProfile.services.map(({ service }) => (
            <span
              key={service.id}
              className="rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700"
            >
              {service.name}
            </span>
          ))}
        </div>
      </div>
    )}

    {vendorProfile?.skills && vendorProfile.skills.length > 0 && (
      <div className="border-t pt-6">
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

    <div className="border-t pt-6">
      <h3 className="mb-4 text-lg font-semibold">Vendor Details</h3>
      <div className="flex flex-col space-y-3">
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
  </div>
);

const ReviewsSection = ({ reviews }: { reviews: typeof clientReviews }) => {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <Star className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-800">No reviews yet</p>
        <p className="mt-2 text-sm text-gray-500">
          Reviews from clients will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: (typeof clientReviews)[0] }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <Image
          src={review.clientAvatar}
          alt={review.clientName}
          className="h-12 w-12 rounded-full"
          width={48}
          height={48}
        />
        <div>
          <h4 className="font-bold">{review.clientName}</h4>
          <p className="text-sm text-gray-500">
            Verified Client · {review.date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
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
      </div>
    </div>
    <p className="mt-4 text-gray-600">&quot;{review.comment}&quot;</p>
  </div>
);

export default VendorProfilePage;
