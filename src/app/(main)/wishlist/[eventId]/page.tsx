"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["wishlist"]["getByEventId"];
type wishlistItem = NonNullable<event["wishlist"]>["items"][number];

const PublicWishlistPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = api.wishlist.getByEventId.useQuery({
    eventId,
  });

  if (isLoading || !event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 text-gray-900 sm:pt-28 md:pt-32">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {event.title}&apos;s Wishlist
              </h1>
              <p className="mt-1 text-gray-500">
                Created by {event.client.name}
              </p>
            </div>
            <Image
              src={event.client.avatarUrl ?? "https://placehold.co/64x64"}
              alt={event.client.name ?? "Client"}
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800">Items</h2>
            {event.wishlist ? (
              <ul className="mt-4 divide-y divide-gray-100">
                {event.wishlist.items.map((item) => (
                  <li key={item.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Est. Price: ₦{item.price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {item.isFulfilled ? (
                          <span className="font-semibold text-green-600">
                            Fulfilled!
                          </span>
                        ) : (
                          <Button>Promise to Fulfill</Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-center text-gray-500">
                No items in this wishlist yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicWishlistPage;
