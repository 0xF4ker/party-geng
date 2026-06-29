"use client";

import React from "react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Calendar,
  Users,
  Wallet,
  ArrowUpRight,
  MapPin,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { headerHeight } = useUiStore();
  const { user, loading: loadingUser } = useAuth();

  // Queries
  const { data: events, isLoading: loadingEvents } = api.coordinator.getMyEvents.useQuery(
    undefined,
    { enabled: !!user && user.role === "COORDINATOR" },
  );

  const { data: wallet, isLoading: loadingWallet } = api.payment.getWallet.useQuery(
    undefined,
    { enabled: !!user && user.role === "COORDINATOR" },
  );

  // Authentication check
  React.useEffect(() => {
    if (!loadingUser && (!user || user.role !== "COORDINATOR")) {
      toast.error("Access denied. Authorized coordinators only.");
      router.push("/login");
    }
  }, [user, loadingUser, router]);

  if (loadingUser || loadingEvents || loadingWallet) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  // Format date helper
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalEvents = events?.length ?? 0;
  const earnings = wallet?.totalEarnings ?? 0;
  const nextEvent = events && events.length > 0 ? events[0] : null;

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 pb-12"
      style={{ paddingTop: headerHeight }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              Coordinator Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, @{user?.username}! Manage your assigned event collaborations.
            </p>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-3 hover:shadow-md transition-shadow font-semibold text-sm"
          >
            <Wallet className="h-4 w-4 text-pink-600" />
            <span>Wallet Account</span>
            <ArrowUpRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hired Events */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex items-center gap-5">
            <div className="rounded-xl bg-pink-50 p-4 text-pink-600">
              <Calendar className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400">Hired Events</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{totalEvents}</p>
            </div>
          </div>

          {/* Wallet Earnings */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex items-center gap-5">
            <div className="rounded-xl bg-green-50 p-4 text-green-600">
              <Wallet className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400">Total Earnings</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                ₦{earnings.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Next Event */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex items-center gap-5">
            <div className="rounded-xl bg-blue-50 p-4 text-blue-600">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-400">Next Event</p>
              <p className="text-lg font-black text-gray-900 mt-1 truncate">
                {nextEvent ? nextEvent.title : "None Scheduled"}
              </p>
              {nextEvent && (
                <p className="text-xs text-gray-500 truncate">
                  {formatDate(nextEvent.startDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Events List */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-gray-900">Your Active Events</h2>

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-pink-100 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-pink-50 text-pink-600 rounded px-2 py-1 mb-2">
                        Assigned
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 leading-snug">
                        {e.title}
                      </h3>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-gray-600 border-t border-gray-50 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>
                          {formatDate(e.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>
                          Host: <strong className="text-gray-900">@{e.client.user.username}</strong> ({e.client.name ?? "No Name"})
                        </span>
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {(e.location as any).name || (e.location as any).address || "Lagos, Nigeria"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 border-t border-gray-50 pt-4">
                    <Link
                      href={`/event/${e.id}/board`}
                      className="flex-1 text-center bg-pink-600 hover:bg-pink-700 text-white rounded-xl py-2.5 font-bold text-sm transition"
                    >
                      Collaborate on Board
                    </Link>
                    <Link
                      href={`/event/${e.id}`}
                      className="flex-1 text-center border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-2.5 font-semibold text-sm transition"
                    >
                      Event Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No events assigned yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                When clients hire you to collaborate on their moodboards and manage their events, they will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
