"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Hash,
  FileText,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.orderId as string;

  // const { data: cart } = api.cart.get.useQuery();

  // useEffect(() => {
  //   console.log("Current cart data:", cart);
  // }, [cart]);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = api.order.getById.useQuery({ id: orderId });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error.message}
      </div>
    );
  }

  if (!order || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Order not found or you are not logged in.
      </div>
    );
  }

  const quote = order.quote;

  if (!quote) {
    return (
      <div className="flex h-screen items-center justify-center">
        Quote not found for this order.
      </div>
    );
  }

  const services = quote.services as { id: number; name: string }[];

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>

        <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-3xl font-bold">{quote.title}</h1>
            <p className="text-gray-500">Order #{order.id.substring(0, 8)}</p>
          </div>

          {/* Body */}
          <div className="grid gap-8 p-6 md:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6 md:col-span-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5 text-pink-600" />
                  What&apos;s Included
                </h3>
                <ul className="list-inside list-disc space-y-1 text-gray-700">
                  {quote.includes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service.id}
                      className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Vendor
                </h3>
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      order.vendor.vendorProfile?.avatarUrl ??
                      `https://placehold.co/40x40`
                    }
                    alt="vendor"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">
                      {order.vendor.vendorProfile?.companyName ??
                        order.vendor.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{order.vendor.username}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5 text-green-600" />
                  Client
                </h3>
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      order.client.clientProfile?.avatarUrl ??
                      `https://placehold.co/40x40`
                    }
                    alt="client"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">
                      {order.client.clientProfile?.name ??
                        order.client.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{order.client.username}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Event Date
                </h3>
                <p className="text-gray-700">
                  {new Date(quote.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  <Hash className="h-5 w-5 text-indigo-600" />
                  Status
                </h3>
                <span
                  className={cn(
                    "mr-2 rounded-full px-2.5 py-0.5 text-sm font-semibold text-white",
                    {
                      "bg-yellow-500": order.status === "ACTIVE",
                      "bg-green-500": order.status === "COMPLETED",
                      "bg-red-500": order.status === "CANCELLED",
                    },
                  )}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end bg-gray-50 p-6">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-3xl font-bold">
                ₦{quote.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
