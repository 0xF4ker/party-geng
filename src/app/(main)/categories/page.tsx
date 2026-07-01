"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { 
  Sparkles, 
  Utensils, 
  Music, 
  Camera, 
  MapPin, 
  Search, 
  Loader2, 
  ChevronRight,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const categoryMetadata: Record<string, { icon: React.ReactNode; desc: string; gradient: string }> = {
  "decor-design": {
    icon: <Sparkles className="h-6 w-6 text-pink-600" />,
    desc: "Decorations, lighting, floral arrangements, and stage setups.",
    gradient: "from-pink-500 to-rose-500",
  },
  "decor-and-design": {
    icon: <Sparkles className="h-6 w-6 text-pink-600" />,
    desc: "Decorations, lighting, floral arrangements, and stage setups.",
    gradient: "from-pink-500 to-rose-500",
  },
  "catering-drinks": {
    icon: <Utensils className="h-6 w-6 text-amber-600" />,
    desc: "Gourmet dishes, finger foods, drinks, and professional server crews.",
    gradient: "from-amber-500 to-orange-500",
  },
  "sound-lighting": {
    icon: <Music className="h-6 w-6 text-indigo-600" />,
    desc: "Premium DJs, speaker systems, event lighting, and live instruments.",
    gradient: "from-indigo-500 to-blue-500",
  },
  "photography-video": {
    icon: <Camera className="h-6 w-6 text-emerald-600" />,
    desc: "Professional photo and video coverage, drones, and post-production.",
    gradient: "from-emerald-500 to-teal-500",
  },

  "venues-halls": {
    icon: <MapPin className="h-6 w-6 text-cyan-600" />,
    desc: "Event centers, open-air gardens, banquet halls, and conference rooms.",
    gradient: "from-cyan-500 to-blue-500",
  },
};

export default function CategoriesPage() {
  const { data: categories, isLoading } = api.category.getAll.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories?.filter((category) => {
    // Coordinators have their own dedicated /coordinators page
    if (category.slug === "coordinators-planners") return false;
    const matchesCategory = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesServices = category.services.some((service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesCategory || matchesServices;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-pink-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading service directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 text-gray-900 sm:pt-28 md:pt-32">
      {/* Visual Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-pink-950 px-6 py-16 sm:px-12 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-xl mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(219,39,119,0.1),transparent)]" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pink-400 border border-pink-500/20">
            Professional Registry
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Event Services & Specialists
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Discover and book vetted vendors, decor designers, coordinators, and equipment suppliers. Everything you need to craft your next unforgettable experience.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mt-8">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories, planners, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:bg-white focus:text-gray-900 focus:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all shadow-inner backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-gray-150 bg-white p-12 text-center shadow-sm max-w-md mx-auto">
            <div className="rounded-full bg-gray-100 p-4 w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Services Found</h3>
            <p className="text-xs text-gray-500 mt-2">
              We couldn't find any categories matching "{searchQuery}". Try refining your search query.
            </p>
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="mt-6 rounded-xl"
            >
              Reset Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category) => {
              const slug = category.slug ?? "";
              const meta = categoryMetadata[slug] || {
                icon: <HelpCircle className="h-6 w-6 text-pink-600" />,
                desc: "Hire certified specialists in this category.",
                gradient: "from-pink-500 to-rose-500",
              };

              return (
                <div 
                  key={category.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-150 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Accent Top Bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header block */}
                      <div className="flex items-start justify-between">
                        <div className="rounded-2xl bg-gray-50 p-3 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                          {meta.icon}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {category.services.length} services
                        </span>
                      </div>

                      {/* Title & description */}
                      <div className="mt-4">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          {meta.desc}
                        </p>
                      </div>

                      {/* Services pills list */}
                      <div className="mt-6 border-t border-gray-50 pt-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Popular Services</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {category.services.slice(0, 4).map((service) => (
                            <Link
                              key={service.id}
                              href={`/categories/${slug}/${service.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 hover:bg-pink-50 border border-slate-100 hover:border-pink-100 px-3 py-1 text-xs text-gray-600 hover:text-pink-600 transition font-medium"
                            >
                              {service.name}
                              <span className="text-[9px] text-gray-400">
                                ({service._count?.vendors ?? 0})
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-50">
                      <Link 
                        href={`/categories/${slug}`}
                        className="inline-flex w-full items-center justify-between rounded-xl bg-slate-900 group-hover:bg-pink-600 text-white font-bold py-2.5 px-4 text-xs transition duration-300"
                      >
                        Browse Specialists
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
