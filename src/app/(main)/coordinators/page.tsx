"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import {
  Search,
  Loader2,
  Star,
  MapPin,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Info,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function CoordinatorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: coordinators, isLoading } = api.coordinator.listAvailable.useQuery();

  const filtered = coordinators?.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q) ||
      (c.bio ?? "").toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 text-gray-900 sm:pt-28 md:pt-32">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-purple-950 px-6 py-16 sm:px-12 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-xl mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(167,139,250,0.1),transparent)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-300 border border-violet-500/20">
            <Crown className="h-3 w-3" /> Event Coordinators
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Find Your{" "}
            <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
              Event Coordinator
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto">
            Platform-vetted coordinators who handle every detail — from guest management and vendor logistics to day-of execution. One flat fee, zero stress.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 pt-2">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{coordinators?.length ?? "—"}</p>
              <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-wider">Available</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-wider">Platform Vetted</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">Flat Rate</p>
              <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-wider">No hidden fees</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mt-4">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:bg-white focus:text-gray-900 focus:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shadow-inner backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            <p className="text-sm font-medium text-gray-500">Loading coordinators...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-150 bg-white p-12 text-center shadow-sm max-w-md mx-auto">
            <div className="rounded-full bg-violet-50 p-4 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? "No Results Found" : "No Coordinators Yet"}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              {searchQuery
                ? `We couldn't find any coordinators matching "${searchQuery}".`
                : "Platform coordinators will appear here once registered."}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")} variant="outline" className="mt-6 rounded-xl">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Info callout */}
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">
              <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-700 leading-relaxed">
                <strong>How it works:</strong> Coordinators are platform-registered professionals, not regular vendors. You hire them directly at a flat rate from your event management page. They gain full access to collaborate on your event board and group chat.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => {
                const location = (c.location as { display_name?: string } | null)?.display_name ?? "Nigeria";
                const displayName = c.name ?? c.user.username;
                const initials = displayName.charAt(0).toUpperCase();

                return (
                  <div
                    key={c.id}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-150 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Top gradient bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-purple-500" />

                    <div className="p-6 flex flex-col gap-5 flex-1">
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          {c.avatarUrl ? (
                            <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-violet-100 shadow-sm">
                              <Image
                                src={c.avatarUrl}
                                alt={displayName}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-black text-white shadow-md shadow-violet-200">
                              {initials}
                            </div>
                          )}
                          {/* Crown badge */}
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 shadow-sm">
                            <Crown className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 truncate">{displayName}</h3>
                          </div>
                          <p className="text-xs text-violet-600 font-semibold mt-0.5">@{c.user.username}</p>
                          <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                            <Sparkles className="h-2.5 w-2.5" /> Event Coordinator
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      {c.bio && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{c.bio}</p>
                      )}

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarCheck className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span>Flat hiring rate — no recurring fees</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Hiring Rate</p>
                          <p className="text-xl font-black text-slate-900">₦{c.price.toLocaleString()}</p>
                        </div>
                        <Link
                          href={`/co/${c.user.username}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-violet-200 hover:from-violet-700 hover:to-purple-700 transition-all hover:shadow-md group-hover:scale-105 duration-200"
                        >
                          View Profile <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
