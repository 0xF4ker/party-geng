"use client";

import { notFound } from "next/navigation";
import PopularServiceCarousel from "../../../_components/category/PopularServiceCarousel";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState, use } from "react";
import LoopingCardAnimation from "@/app/_components/category/LoopingCardAnimation";
import Image from "next/image";
import { slugify } from "@/lib/utils";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
// 1. Get the type for the entire procedure's output (which can be null)
type CategoryOutput = routerOutput["category"]["getBySlug"];

// 2. Get the non-null type for the Category itself
// This type is: { id, name, services: [...] }
export type Category = NonNullable<CategoryOutput>;

// 3. Get the type for the 'services' array from the Category
type ServicesArray = Category["services"];

// 4. This is the one you want: the type for a *single service* in that array
// This will be: { id, name, _count: {...}, gigs: [...] }
export type ServiceWithVendors = ServicesArray[number];

// 5. (As a bonus) You can even go one level deeper to get the type of a single gig
type VendorsArray = ServiceWithVendors["_count"]["vendors"];
// export type GigWithVendor = GigsArray[number];

// interface Category {
//   name: string;
//   description: string;
//   popular: string[];
//   services: string[] | { groupName: string; image: string; items: string[] }[];
// }

// type ApiService = NonNullable<
//   Awaited<ReturnType<typeof api.category.getBySlug.useQuery>>["data"]
// >["services"][number];

const FlatServicesList = ({
  services,
  categorySlug,
}: {
  services: ServiceWithVendors[];
  categorySlug: string;
}) => (
  <ul className="columns-1 gap-x-6 sm:columns-2 md:columns-3 lg:columns-4">
    {services.map((service) => (
      <li key={service.id} className="mb-3 break-inside-avoid">
        <a
          href={`/categories/${categorySlug}/${slugify(service.name)}`}
          className="text-lg text-gray-700 hover:text-pink-500 hover:underline"
        >
          {service.name} ({service._count.vendors})
        </a>
      </li>
    ))}
  </ul>
);

// Component for GROUPED services (e.g., Bands)
const GroupedServices = ({
  services,
}: {
  services: { groupName: string; image: string; items: string[] }[];
}) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (groupName: string) => {
    setOpenItem(openItem === groupName ? null : groupName);
  };

  return (
    <>
      {/* --- Mobile: Accordion --- */}
      <div className="space-y-4 md:hidden">
        {services.map((group) => (
          <div
            key={group.groupName}
            className="border-b border-gray-200 last:border-b-0"
          >
            <button
              onClick={() => toggleItem(group.groupName)}
              className="flex w-full items-center justify-between py-4"
            >
              <div className="flex items-center space-x-4">
                <Image
                  src={group.image}
                  alt={group.groupName}
                  className="h-16 w-20 rounded-md object-cover"
                  width={80}
                  height={60}
                />
                <h3 className="text-left text-lg font-semibold text-gray-800">
                  {group.groupName}
                </h3>
              </div>
              <ChevronDown
                className={cn(
                  "h-6 w-6 text-gray-500 transition-transform",
                  openItem === group.groupName ? "rotate-180" : "",
                )}
              />
            </button>
            {/* Accordion Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                openItem === group.groupName ? "max-h-screen pb-4" : "max-h-0",
              )}
            >
              <ul className="space-y-2 pl-24">
                {group.items.map((item) => (
                  <li key={item}>
                    <a
                      href={`/services/${item
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                      className="text-base text-gray-700 hover:text-pink-500 hover:underline"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* --- Desktop: Visual Grid --- */}
      <div className="hidden gap-x-6 gap-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((group) => (
          <div key={group.groupName} className="flex flex-col">
            <a
              href="#" // This link could go to a "group" page if one exists
              className="mb-4 block"
            >
              <Image
                src={group.image}
                alt={group.groupName}
                className="aspect-4/3 h-auto w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
                width={320}
                height={240}
              />
            </a>
            <h3 className="mb-3 text-xl font-semibold text-gray-800">
              {group.groupName}
            </h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item}>
                  <a
                    href={`/services/${item.toLowerCase().replace(/ /g, "-")}`}
                    className="text-base text-gray-700 hover:text-pink-500 hover:underline"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};

// Main component to decide which layout to show
type ServiceGroup = {
  groupName: string;
  image: string;
  items: string[];
};

const ExploreServices = ({
  services,
  categorySlug,
}: {
  services: ServiceWithVendors[];
  categorySlug: string;
}) => {
  return <FlatServicesList categorySlug={categorySlug} services={services} />;
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = use(params);

  // Fetch category from database
  const { data: category, isLoading } = api.category.getBySlug.useQuery({
    slug,
  });

  if (isLoading) {
    return (
      <main className="bg-white py-44">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading category...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!category) {
    notFound();
  }

  const services = category.services;
  // Get popular services (services with most vendors)
  const popularServices = services
    .filter((s) => s._count.vendors > 0)
    .sort((a, b) => b._count.vendors - a._count.vendors)
    .slice(0, 8);

  return (
    <main className="bg-white py-44">
      {/* 1. Hero Section */}
      <div
        className="container mx-auto flex items-center justify-center bg-linear-to-r from-pink-500 to-purple-600 px-4 py-12 text-white"
        style={{ backgroundColor: "#003916" /* Matching GIF dark green */ }}
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="mb-2 text-4xl font-bold">{category.name}</h1>
          <p className="text-lg text-green-100">
            Find the best {category.name.toLowerCase()} services for your event
          </p>
          <button className="mt-6 flex items-center space-x-2 rounded-md border border-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-green-800">
            <span>How Partygeng Works</span>
          </button>
        </div>
      </div>

      {/* 2. Popular Services Carousel */}
      {popularServices.length > 0 && (
        <div className="container mx-auto px-4 py-10">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Most popular in {category.name}
          </h2>
          <PopularServiceCarousel
            services={popularServices.map((s) => s.name)}
            // categorySlug={slug}
          />
        </div>
      )}

      {/* 3. Replaced "Big Project" Block */}
      <LoopingCardAnimation />

      {/* 4. UPDATED: Explore Services Section (with conditional logic) */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Explore {category.name}
        </h2>
        <ExploreServices services={services} categorySlug={slug} />
      </div>
    </main>
  );
}
