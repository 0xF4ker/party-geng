"use client";

import React, { use } from "react";
import { notFound, redirect } from "next/navigation";
import PopularServiceCarousel from "../../../_components/category/PopularServiceCarousel";
import { slugify } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { 
  Sparkles, 
  Utensils, 
  Music, 
  Camera, 
  MapPin, 
  HelpCircle, 
  ChevronRight, 
  Info,
  ArrowRight,
  Loader2,
  Users
} from "lucide-react";
import Link from "next/link";

type routerOutput = inferRouterOutputs<AppRouter>;
type CategoryOutput = routerOutput["category"]["getBySlug"];
export type Category = NonNullable<CategoryOutput>;
type ServicesArray = Category["services"];
export type ServiceWithVendors = ServicesArray[number];

const categoryMetadata: Record<string, { icon: React.ReactNode; desc: string; gradient: string; accent: string }> = {
  "decor-design": {
    icon: <Sparkles className="h-8 w-8 text-pink-500" />,
    desc: "Decorations, lighting, floral arrangements, and stage setups.",
    gradient: "from-slate-900 via-pink-950 to-slate-900",
    accent: "from-pink-500 to-rose-500",
  },
  "decor-and-design": {
    icon: <Sparkles className="h-8 w-8 text-pink-500" />,
    desc: "Decorations, lighting, floral arrangements, and stage setups.",
    gradient: "from-slate-900 via-pink-950 to-slate-900",
    accent: "from-pink-500 to-rose-500",
  },
  "catering-drinks": {
    icon: <Utensils className="h-8 w-8 text-amber-500" />,
    desc: "Gourmet dishes, finger foods, drinks, and professional server crews.",
    gradient: "from-slate-900 via-amber-950 to-slate-900",
    accent: "from-amber-500 to-orange-500",
  },
  "sound-lighting": {
    icon: <Music className="h-8 w-8 text-indigo-500" />,
    desc: "Premium DJs, speaker systems, event lighting, and live instruments.",
    gradient: "from-slate-900 via-indigo-950 to-slate-900",
    accent: "from-indigo-500 to-blue-500",
  },
  "photography-video": {
    icon: <Camera className="h-8 w-8 text-emerald-500" />,
    desc: "Professional photo and video coverage, drones, and post-production.",
    gradient: "from-slate-900 via-emerald-950 to-slate-900",
    accent: "from-emerald-500 to-teal-500",
  },

  "venues-halls": {
    icon: <MapPin className="h-8 w-8 text-cyan-500" />,
    desc: "Event centers, open-air gardens, banquet halls, and conference rooms.",
    gradient: "from-slate-900 via-cyan-950 to-slate-900",
    accent: "from-cyan-500 to-blue-500",
  },
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = use(params);

  // Coordinators have their own dedicated page
  if (slug === "coordinators-planners") {
    redirect("/coordinators");
  }

  const { data: category, isLoading } = api.category.getBySlug.useQuery({
    slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-pink-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading category details...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const services = category.services;
  const popularServices = services
    .filter((s) => s._count.vendors > 0)
    .sort((a, b) => b._count.vendors - a._count.vendors)
    .slice(0, 8);

  const meta = categoryMetadata[slug] || {
    icon: <HelpCircle className="h-8 w-8 text-pink-500" />,
    desc: `Find the best ${category.name.toLowerCase()} services for your event.`,
    gradient: "from-slate-900 via-purple-950 to-slate-900",
    accent: "from-pink-500 to-rose-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 text-gray-900 sm:pt-28 md:pt-32">
      {/* Category Banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${meta.gradient} px-6 py-16 sm:px-12 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-xl mb-12`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(219,39,119,0.08),transparent)]" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 w-fit mx-auto backdrop-blur-sm">
            {meta.icon}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            {category.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto">
            {meta.desc}
          </p>
          <div className="pt-2">
            <Link
              href="/frequently-asked-questions"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              <Info className="h-3.5 w-3.5 text-pink-400" />
              How Partygeng Works
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 2. Popular Services Carousel */}
        {popularServices.length > 0 && (
          <div className="rounded-3xl border border-gray-150 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" />
              Most Popular in {category.name}
            </h2>
            <PopularServiceCarousel
              services={popularServices.map((s) => s.name)}
            />
          </div>
        )}

        {/* 3. Explore Grid */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Explore {category.name}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Select a specific service type to filter active specialists.</p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-white">
              <p className="text-sm text-gray-500">No services have been configured for this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/categories/${slug}/${slugify(service.name)}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-150 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${meta.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                      <Users className="h-3.5 w-3.5" />
                      <span>{service._count.vendors} Active Professionals</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-bold text-gray-600 group-hover:text-pink-600 transition-colors pt-3 border-t border-gray-50">
                    <span>View Providers</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
