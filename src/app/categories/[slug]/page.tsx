"use client";

import { notFound } from "next/navigation";
import { categoriesData } from "../../local/categoryv2";
import PopularServiceCarousel from "../../_components/category/PopularServiceCarousel";
import { Check } from "lucide-react";
import React, { use, useEffect } from "react";
import Image from "next/image";

const slugify = (text: string) =>
  text.toLowerCase().replace(/ \/ /g, "-").replace(/ /g, "-");

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  useEffect(() => {
    console.log("Category slug:", slug);
  }, [slug]);

  const category = categoriesData.find((c) => slugify(c.name) === slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="bg-white py-44">
      {/* 1. Hero Section */}
      <div
        className="bg-green-800 px-4 py-12 text-white"
        style={{ backgroundColor: "#003916" /* Matching GIF dark green */ }}
      >
        <div className="container mx-auto">
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

      {/* 3. "Big Project" Block - Now Event Focused */}
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-between rounded-lg bg-yellow-50 p-8 md:flex-row">
          {/* Left Side: Text Content */}
          <div className="mb-6 md:mb-0 md:w-1/2">
            <h2 className="mb-4 text-3xl font-bold text-gray-800">
              Big event planning? We&apos;ll handle it
            </h2>
            <p className="mb-4 text-gray-600">
              From vendor sourcing to day-of coordination, work with a certified
              event manager who:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                Consistently manages large and small events
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                Was carefully selected and certified by Partygeng
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                Has proven expertise in your event&apos;s domain
              </li>
            </ul>
            <button className="mt-6 rounded-md bg-gray-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-gray-700">
              Book a free consultation
            </button>
          </div>

          {/* Right Side: Manager Images */}
          <div className="relative flex h-48 justify-center md:w-1/2 md:justify-end">
            <div className="absolute top-0 right-10 h-56 w-40 rotate-6 transform rounded-lg bg-white p-4 text-center shadow-lg">
              <Image
                src="https://placehold.co/100x100/EFEFEF/333?text=E"
                width={96}
                height={96}
                className="mx-auto mb-2 h-24 w-24 rounded-full border-2 border-gray-200"
                alt="Eugene"
              />
              <h4 className="font-semibold">Eugene C.</h4>
            </div>
            <div className="absolute top-4 right-1/2 z-10 h-56 w-40 translate-x-1/2 rounded-lg bg-white p-4 text-center shadow-xl">
              <Image
                src="https://placehold.co/100x100/EFEFEF/333?text=C"
                width={96}
                height={96}
                className="mx-auto mb-2 h-24 w-24 rounded-full border-2 border-gray-200"
                alt="Carolina"
              />
              <h4 className="font-semibold">Carolina A.</h4>
            </div>
            <div className="absolute top-0 left-10 h-56 w-40 -rotate-6 transform rounded-lg bg-white p-4 text-center shadow-lg">
              <Image
                src="https://placehold.co/100x100/EFEFEF/333?text=V"
                width={96}
                height={96}
                className="mx-auto mb-2 h-24 w-24 rounded-full border-2 border-gray-200"
                alt="Viktor"
              />
              <h4 className="font-semibold">Viktor M.</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 4. NEW: Explore Services Grid */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Explore {category.name}
        </h2>

        {/* Grid of services */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {category.services.map((service) => (
            <a
              key={service}
              // This link would go to the service page
              href={`/services/${service.toLowerCase().replace(/ /g, "-")}`}
              className="group block"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <Image
                  src={`https://placehold.co/400x250/EFEFEF/555?text=${service.replace(/ /g, "+")}`}
                  alt={service}
                  fill
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-800 transition-colors group-hover:text-pink-500">
                {service}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
