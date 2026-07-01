"use client";

import React, { use } from "react";
import { api } from "@/trpc/react";
import {
  Loader2,
  MapPin,
  Crown,
  Sparkles,
  CalendarCheck,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function CoordinatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
  } = api.coordinator.getByUsername.useQuery({ username });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading coordinator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center max-w-sm shadow-sm">
          <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-sm text-gray-500 mt-2">This coordinator profile doesn't exist.</p>
          <Link
            href="/coordinators"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
          >
            Browse Coordinators
          </Link>
        </div>
      </div>
    );
  }

  const { profile, eventsCount } = data;
  const coordinatorUser = data.user;
  const displayName = profile.name ?? coordinatorUser.username;
  const location = (profile.location as { display_name?: string } | null)?.display_name ?? "Nigeria";
  const joinedDate = coordinatorUser.createdAt ? new Date(coordinatorUser.createdAt) : new Date();

  const isOwnProfile = user?.id === coordinatorUser.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 text-gray-900">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-purple-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_60%,rgba(139,92,246,0.2),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(167,139,250,0.1),transparent)] pointer-events-none" />

        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container mx-auto max-w-4xl px-4 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center gap-6 sm:flex-row sm:text-left sm:items-end sm:gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-3xl border-4 border-violet-400/30 shadow-2xl shadow-violet-900/40">
                  <Image
                    src={profile.avatarUrl}
                    alt={displayName}
                    width={144}
                    height={144}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-5xl font-black text-white shadow-2xl shadow-violet-900/40 border-4 border-violet-400/30">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Crown badge */}
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{displayName}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 px-3 py-1 text-xs font-bold text-violet-200 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" /> Event Coordinator
                </span>
              </div>
              <p className="text-sm text-gray-400">@{coordinatorUser.username}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <CalendarCheck className="h-4 w-4 text-violet-300" />
                  <span>{eventsCount} events coordinated</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4 text-violet-300" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Clock className="h-4 w-4 text-violet-300" />
                  <span>Member since {format(joinedDate, "MMMM yyyy")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Bio + highlights */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <Crown className="h-4 w-4 text-violet-600" />
                </span>
                About
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {profile.bio ?? "This coordinator hasn't added a bio yet."}
              </p>
            </div>

            {/* What coordinators do */}
            <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">What a Coordinator Does for You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Day-of event management",
                  "Guest list & RSVP handling",
                  "Vendor coordination & logistics",
                  "Seating arrangement & table assignments",
                  "Moodboard collaboration",
                  "Budget tracking support",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Pricing card + CTA */}
          <div className="space-y-4">
            {/* Pricing + Hire CTA */}
            <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />

              <div className="text-center space-y-1 mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flat Hiring Rate</p>
                <p className="text-4xl font-black text-slate-900">₦{profile.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">One-time fee · No hidden charges</p>
              </div>

              {/* Hire button - only shown to logged-in non-coordinator users */}
              {!isOwnProfile ? (
                <Link
                  href="/manage_events"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-200 hover:from-violet-700 hover:to-purple-700 transition-all hover:shadow-lg active:scale-95"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Hire for my Event
                </Link>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-50 border border-gray-200 py-3.5 text-sm font-semibold text-gray-500">
                  This is your profile
                </div>
              )}

              <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed">
                Hire from your event management page after selecting your event.
              </p>
            </div>

            {/* Location card */}
            <div className="rounded-2xl border border-gray-150 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                  <MapPin className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Based in</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{location}</p>
                </div>
              </div>
            </div>

            {/* Browse more */}
            <Link
              href="/coordinators"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-xs font-semibold text-gray-600 hover:border-violet-200 hover:text-violet-600 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Browse All Coordinators
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
