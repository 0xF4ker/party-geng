"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Eye,
  MoreVertical,
  Trash2,
  Briefcase,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
// import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type GigWithRelations = routerOutput["gig"]["getMyGigs"][number];

// --- Main Page Component ---
const VendorGigsPage = () => {
  // const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAUSED" | "DRAFT">(
    "ACTIVE",
  );

  // Fetch gigs from API
  const { data: allGigs, isLoading } = api.gig.getMyGigs.useQuery();

  // Filter by status
  const filteredGigs = allGigs?.filter((gig) => gig.status === activeTab) ?? [];

  // Count gigs by status
  const activeCount = allGigs?.filter((g) => g.status === "ACTIVE").length ?? 0;
  const pausedCount = allGigs?.filter((g) => g.status === "PAUSED").length ?? 0;
  const draftCount = allGigs?.filter((g) => g.status === "DRAFT").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* FIX: Removed grid layout, now single column */}
        <div className="mx-auto max-w-4xl space-y-8">
          {/* REMOVED: Left Column (Sticky Sidebar on Desktop) */}

          {/* Right Column (Main Content) - Now full width */}
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold text-gray-800">My Gigs</h1>
              <Link href="/v/manage_gigs/new">
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700 md:w-auto">
                  <Plus className="h-5 w-5" />
                  Create New Gig
                </button>
              </Link>
            </div>

            {/* Gig List Area */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center border-b border-gray-200">
                <TabButton
                  title="Active"
                  count={activeCount}
                  isActive={activeTab === "ACTIVE"}
                  onClick={() => setActiveTab("ACTIVE")}
                />
                <TabButton
                  title="Paused"
                  count={pausedCount}
                  isActive={activeTab === "PAUSED"}
                  onClick={() => setActiveTab("PAUSED")}
                />
                <TabButton
                  title="Draft"
                  count={draftCount}
                  isActive={activeTab === "DRAFT"}
                  onClick={() => setActiveTab("DRAFT")}
                />
              </div>

              {/* Gig List */}
              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading gigs...</div>
                  </div>
                ) : filteredGigs.length > 0 ? (
                  filteredGigs.map((gig) => (
                    <GigManagementCard key={gig.id} gig={gig} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Briefcase className="mb-4 h-12 w-12 text-gray-300" />
                    <p className="mb-2 font-medium text-gray-500">
                      No {activeTab.toLowerCase()} gigs
                    </p>
                    <p className="mb-4 text-sm text-gray-400">
                      {activeTab === "ACTIVE" &&
                        "Create your first gig to start receiving bookings"}
                      {activeTab === "PAUSED" && "No paused gigs at the moment"}
                      {activeTab === "DRAFT" && "No draft gigs saved"}
                    </p>
                    {activeTab === "ACTIVE" && (
                      <Link href="/v/manage_gigs/new">
                        <button className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700">
                          Create Your First Gig
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

// REMOVED: VendorSidebar component

const TabButton = ({
  title,
  count,
  isActive,
  onClick,
}: {
  title: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {title}
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold",
        isActive ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600",
      )}
    >
      {count}
    </span>
  </button>
);

// "Our Twist" - Gig Management Card
const GigManagementCard = ({ gig }: { gig: GigWithRelations }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  // Toggle status mutation
  const updateStatus = api.gig.updateStatus.useMutation({
    onSuccess: () => {
      void utils.gig.getMyGigs.invalidate();
    },
  });

  // Delete mutation
  const deleteGig = api.gig.delete.useMutation({
    onSuccess: () => {
      void utils.gig.getMyGigs.invalidate();
    },
  });

  const handleToggleStatus = () => {
    const newStatus = gig.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    updateStatus.mutate({ id: gig.id, status: newStatus });
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${gig.title}"? This action cannot be undone.`,
      )
    ) {
      deleteGig.mutate({ id: gig.id });
    }
    setIsMenuOpen(false);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const firstImage =
    gig.galleryImageUrls?.[0] ??
    "https://placehold.co/400x300/ec4899/ffffff?text=Gig";

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Image
          src={firstImage}
          alt={gig.title}
          className="aspect-video w-full shrink-0 rounded-lg object-cover md:aspect-4/3 md:w-32"
          width={160}
          height={120}
        />
        <div className="grow">
          <Link href={`/gigs/${gig.id}`}>
            <p className="cursor-pointer text-base font-medium text-gray-700 transition-colors hover:text-pink-600">
              {gig.title}
            </p>
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            Starting at{" "}
            <span className="font-semibold text-gray-700">
              ₦{gig.basePrice.toLocaleString()}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {gig.service.category.name} • {gig.service.name}
          </p>
        </div>

        {/* Our Twist: Stats */}
        <div className="grid shrink-0 grid-cols-3 gap-4 text-center md:text-left">
          <div>
            <p className="text-xs text-gray-500">Views</p>
            <p className="font-semibold text-gray-800">-</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="font-semibold text-gray-800">
              {gig._count?.orders ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quotes</p>
            <p className="font-semibold text-gray-800">
              {gig._count?.quotes ?? 0}
            </p>
          </div>
        </div>

        {/* Our Twist: Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Status Toggle */}
          <button
            onClick={handleToggleStatus}
            disabled={updateStatus.isPending}
            title={gig.status === "PAUSED" ? "Activate Gig" : "Pause Gig"}
          >
            {gig.status === "PAUSED" ? (
              <ToggleLeft
                className={cn(
                  "h-10 w-10",
                  updateStatus.isPending
                    ? "text-gray-300"
                    : "text-gray-400 hover:text-gray-600",
                )}
              />
            ) : (
              <ToggleRight
                className={cn(
                  "h-10 w-10",
                  updateStatus.isPending
                    ? "text-green-300"
                    : "text-green-500 hover:text-green-600",
                )}
              />
            )}
          </button>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full p-2 hover:bg-gray-200"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <Link href={`/v/manage_gigs/${gig.id}/edit`}>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                </Link>
                <Link href={`/gigs/${gig.id}`} target="_blank">
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    <Eye className="h-4 w-4" /> Preview
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleteGig.isPending}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-pink-600 hover:bg-pink-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />{" "}
                  {deleteGig.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorGigsPage;
