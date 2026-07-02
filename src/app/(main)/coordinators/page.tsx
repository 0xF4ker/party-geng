"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import {
  Search,
  Loader2,
  MapPin,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Info,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AddFundsModal } from "@/app/_components/payments/AddFundsModal";

export default function CoordinatorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: coordinators, isLoading } = api.coordinator.listAvailable.useQuery();
  const { data: profile } = api.user.getProfile.useQuery();
  const isClient = profile?.role === "CLIENT";

  // State for direct hiring flow
  const [selectedCoordinator, setSelectedCoordinator] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [requiredFunds, setRequiredFunds] = useState<number>(0);

  const { data: events, isLoading: isEventsLoading } = api.event.getMyEvents.useQuery(undefined, {
    enabled: isHireModalOpen,
  });
  const { data: wallet, refetch: refetchWallet } = api.payment.getWallet.useQuery(undefined, {
    enabled: isHireModalOpen,
  });

  const hireMutation = api.event.hireCoordinator.useMutation({
    onSuccess: (data) => {
      toast.success(`Hired ${selectedCoordinator?.name || "coordinator"} successfully!`);
      setIsHireModalOpen(false);
      router.push(`/event/${selectedEventId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to hire coordinator.");
    },
  });

  const filtered = coordinators?.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q) ||
      (c.bio ?? "").toLowerCase().includes(q)
    );
  }) ?? [];

  const handleOpenHireModal = (coordinator: any) => {
    setSelectedCoordinator(coordinator);
    setSelectedEventId("");
    setIsHireModalOpen(true);
  };

  const eligibleEvents = events?.upcoming.filter((e) => !e.coordinatorId) || [];
  const balance = wallet?.availableBalance ?? 0;

  const handleConfirmHire = () => {
    if (!selectedEventId || !selectedCoordinator) return;
    if (balance < selectedCoordinator.price) {
      const deficit = selectedCoordinator.price - balance;
      setRequiredFunds(deficit);
      setIsAddFundsOpen(true);
      return;
    }
    hireMutation.mutate({
      eventId: selectedEventId,
      coordinatorId: selectedCoordinator.id,
    });
  };

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
                <strong>How it works:</strong> Coordinators are platform-registered professionals, not regular vendors. You hire them directly at a flat rate from here or your event page. They gain full access to collaborate on your event board and group chat.
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/co/${c.user.username}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-250 bg-white hover:bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700 transition-all"
                          >
                            Profile
                          </Link>
                          {isClient && (
                            <button
                              onClick={() => handleOpenHireModal(c)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-violet-200 hover:from-violet-700 hover:to-purple-700 transition-all hover:shadow-md group-hover:scale-105 duration-200"
                            >
                              Hire Now <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Hire Coordinator Modal */}
      {isHireModalOpen && selectedCoordinator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top gradient accent line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-gray-900">Hire Coordinator</h3>
              </div>
              <button
                onClick={() => setIsHireModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-violet-50/50 p-4 border border-violet-100">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm">
                {selectedCoordinator.avatarUrl ? (
                  <img
                    src={selectedCoordinator.avatarUrl}
                    alt={selectedCoordinator.name || selectedCoordinator.user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (selectedCoordinator.name || selectedCoordinator.user.username).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-950">{selectedCoordinator.name || selectedCoordinator.user.username}</p>
                <p className="text-xs text-violet-600 font-semibold mt-0.5">@{selectedCoordinator.user.username}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Select Event
              </label>
              
              {isEventsLoading ? (
                <div className="flex justify-center items-center py-6 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-650" />
                  <span className="text-xs text-gray-500">Loading events...</span>
                </div>
              ) : eligibleEvents.length === 0 ? (
                <div className="text-center rounded-2xl border border-dashed border-gray-250 p-6 bg-gray-50">
                  <p className="text-xs text-gray-500 font-medium">
                    You don't have any upcoming events without a coordinator.
                  </p>
                  <Link
                    href="/manage_events"
                    className="inline-flex mt-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 text-xs transition shadow-sm shadow-violet-200"
                  >
                    Manage / Create Event
                  </Link>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {eligibleEvents.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedEventId === evt.id
                          ? "border-violet-600 bg-violet-50/50 text-violet-900 font-semibold"
                          : "border-gray-150 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">{evt.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(evt.startDate).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </p>
                      </div>
                      {selectedEventId === evt.id && (
                        <span className="h-4.5 w-4.5 rounded-full bg-violet-600 flex items-center justify-center text-white text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedEventId && (
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Hiring Price</span>
                  <span className="font-bold text-gray-900">₦{selectedCoordinator.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-t border-gray-100 pt-2">
                  <span>Your Balance</span>
                  <span className={`font-bold ${balance >= selectedCoordinator.price ? "text-green-600" : "text-red-500"}`}>
                    ₦{balance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {selectedEventId && balance < selectedCoordinator.price && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-red-700 text-[11px] leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Insufficient funds:</strong> You need an additional ₦{(selectedCoordinator.price - balance).toLocaleString()} to hire this coordinator.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsHireModalOpen(false)}
                className="flex-1 rounded-xl py-5"
                disabled={hireMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmHire}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-5 disabled:opacity-50"
                disabled={!selectedEventId || hireMutation.isPending}
              >
                {hireMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : balance < selectedCoordinator.price ? (
                  "Fund & Hire"
                ) : (
                  "Confirm Hire"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {isAddFundsOpen && (
        <AddFundsModal
          onClose={async () => {
            setIsAddFundsOpen(false);
            await refetchWallet();
          }}
          initialAmount={requiredFunds}
        />
      )}
    </div>
  );
}

