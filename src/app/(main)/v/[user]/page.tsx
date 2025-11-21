"use client";

import React, { useState } from "react";
import {
  Star,
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
import { GalleryTab } from "@/app/_components/profile/GalleryTab";
import { formatDistanceToNow } from "date-fns";

type routerOutput = inferRouterOutputs<AppRouter>;
type review = routerOutput["review"]["getForVendor"][0];

// --- Main Page Component ---
const VendorProfilePage = () => {
  const params = useParams();
  const username = params.user as string;
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("gallery");

  const {
    data: vendorProfile,
    isLoading: vendorLoading,
    error: vendorError,
  } = api.vendor.getByUsername.useQuery({ username });
    
  const { data: reviews, isLoading: reviewsLoading } = api.review.getForVendor.useQuery({
    vendorId: vendorProfile?.userId ?? "",
  }, {
      enabled: !!vendorProfile?.userId,
  });

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
        reviews={reviews}
      />

      <main className="container mx-auto max-w-4xl px-4">
        <div className="py-8">
          {activeTab === "gallery" && <GalleryTab username={username} />}
          {activeTab === "reviews" && (
            <ReviewsSection reviews={reviews ?? []} isLoading={reviewsLoading}/>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const ReviewsSection = ({ reviews, isLoading }: { reviews: review[], isLoading: boolean }) => {
  if (isLoading) {
      return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }
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

const ReviewCard = ({ review }: { review: review }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <Image
          src={review.author.clientProfile?.avatarUrl ?? `https://placehold.co/40x40/ec4899/ffffff?text=${review.author.username.charAt(0)}`}
          alt={review.author.username}
          className="h-12 w-12 rounded-full"
          width={48}
          height={48}
        />
        <div>
          <h4 className="font-bold">{review.author.clientProfile?.name ?? review.author.username}</h4>
          <p className="text-sm text-gray-500">
            Verified Client · {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
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
