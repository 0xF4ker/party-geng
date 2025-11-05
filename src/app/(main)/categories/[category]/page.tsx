"use client";

import { notFound } from "next/navigation";
import { categoriesData } from "../../../local/categoryv2";
import PopularServiceCarousel from "../../../_components/category/PopularServiceCarousel";
import { ChevronDown } from "lucide-react";
import React, { use, useEffect, useState } from "react";
import LoopingCardAnimation from "@/app/_components/category/LoopingCardAnimation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { slugify } from "@/lib/utils";
// Component for NON-grouped services (e.g., DJs, Solo Musicians)
const FlatServicesList = ({
  services,
  category,
}: {
  services: string[];
  category: any;
}) => (
  <ul className="columns-1 gap-x-6 sm:columns-2 md:columns-3 lg:columns-4">
    {services.map((service) => (
      <li key={service} className="mb-3 break-inside-avoid">
        <a
          href={`/categories/${category.name}/${service.toLowerCase().replace(/ /g, "-")}`}
          className="text-lg text-gray-700 hover:text-pink-500 hover:underline"
        >
          {service}
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
                className="aspect-[4/3] h-auto w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
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
  category,
}: {
  services: string[] | ServiceGroup[];
  category: any;
}) => {
  // Check if the first item in the services array is an object with a 'groupName' key
  const hasGroups =
    typeof services[0] === "object" &&
    services[0] !== null &&
    !Array.isArray(services[0]) &&
    "groupName" in services[0];

  if (hasGroups) {
    return <GroupedServices services={services as ServiceGroup[]} />;
  }

  return (
    <FlatServicesList category={category} services={services as string[]} />
  );
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = use(params);

  useEffect(() => {
    console.log("Category slug:", slug);
  }, [slug]);

  const category = categoriesData.find((c) => slugify(c.name) === slug);

  if (!category) {
    notFound();
  }

  const services = category.services;

  return (
    <main className="bg-white py-44">
      {/* 1. Hero Section */}
      <div
        className="container mx-auto flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-12 text-white"
        style={{ backgroundColor: "#003916" /* Matching GIF dark green */ }}
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="mb-2 text-4xl font-bold">{category.name}</h1>
          <p className="text-lg text-green-100">{category.description}</p>
          <button className="mt-6 flex items-center space-x-2 rounded-md border border-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-green-800">
            <span>How Partygeng Works</span>
          </button>
        </div>
      </div>

      {/* 2. Popular Services Carousel */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          Most popular in {category.name}
        </h2>
        <PopularServiceCarousel services={category.popular} />
      </div>

      {/* 3. Replaced "Big Project" Block */}
      <LoopingCardAnimation />

      {/* 4. UPDATED: Explore Services Section (with conditional logic) */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Explore {category.name}
        </h2>
        <ExploreServices services={services} category={category} />
      </div>
    </main>
  );
}
