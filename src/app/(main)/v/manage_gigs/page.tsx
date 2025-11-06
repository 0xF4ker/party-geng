"use client";
// @ts-nocheck

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  Heart,
  Check,
  MapPin,
  Languages,
  Award,
  MessageSquare,
  Clock,
  Briefcase,
  Users,
  Plus,
  List,
  Edit,
  Image as ImageIcon,
  MessageCircle,
  Calendar,
  Search,
  Gift,
  ChevronRight,
  LayoutGrid,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Mail,
  ToggleLeft,
  ToggleRight,
  Eye,
  MoreVertical,
  BarChart,
  MousePointerClick,
  Trash2,
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const vendorDetails = {
  name: "DJ SpinMaster",
  avatarUrl: "https://placehold.co/128x128/ec4899/ffffff?text=DJ",
  level: "Level 2",
  rating: 4.9,
  responseRate: "98%",
  isAvailable: true,
  earningsThisMonth: 450000,
};

const recentMessages = [
  {
    id: 1,
    name: "Adebayo P.",
    time: "2h ago",
    lastMessage: "Hi! Looking for a DJ...",
  },
  {
    id: 2,
    name: "Chioma E.",
    time: "8h ago",
    lastMessage: "Requesting a quote...",
  },
  {
    id: 3,
    name: "Tunde O.",
    time: "1d ago",
    lastMessage: "Thanks for the great set!",
  },
];

// Gigs data with stats
const allGigs = [
  {
    id: 1,
    title: "I will be the professional wedding DJ for your reception",
    price: 150000,
    imageUrl: "https://placehold.co/400x300/ec4899/ffffff?text=Wedding+DJ",
    status: "Active",
    stats: {
      impressions: "10.2k",
      clicks: 320,
      quotesSent: 12,
    },
  },
  {
    id: 2,
    title: "I will provide premium DJ services for corporate events",
    price: 400000,
    imageUrl: "https://placehold.co/400x300/ef4444/ffffff?text=Corporate+DJ",
    status: "Active",
    stats: {
      impressions: "5.1k",
      clicks: 150,
      quotesSent: 5,
    },
  },
  {
    id: 3,
    title: "I will DJ your birthday party with Afrobeats & Amapiano",
    price: 100000,
    imageUrl: "https://placehold.co/400x300/3b82f6/ffffff?text=Birthday+Party",
    status: "Active",
    stats: {
      impressions: "8.8k",
      clicks: 280,
      quotesSent: 10,
    },
  },
  {
    id: 4,
    title: "I will provide full sound system rental for your event",
    price: 80000,
    imageUrl: "https://placehold.co/400x300/10b981/ffffff?text=Sound+System",
    status: "Paused",
    stats: {
      impressions: "1.2k",
      clicks: 30,
      quotesSent: 2,
    },
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const VendorGigsPage = () => {
  // REMOVED: All sticky sidebar state and refs
  const [activeTab, setActiveTab] = useState("Active");

  // REMOVED: All sticky sidebar effects (useLayoutEffect, useEffect)

  const filteredGigs = allGigs.filter((gig) => gig.status === activeTab);

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
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700 md:w-auto">
                <Plus className="h-5 w-5" />
                Create New Gig
              </button>
            </div>

            {/* Gig List Area */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center border-b border-gray-200">
                <TabButton
                  title="Active"
                  count={allGigs.filter((g) => g.status === "Active").length}
                  isActive={activeTab === "Active"}
                  onClick={() => setActiveTab("Active")}
                />
                <TabButton
                  title="Paused"
                  count={allGigs.filter((g) => g.status === "Paused").length}
                  isActive={activeTab === "Paused"}
                  onClick={() => setActiveTab("Paused")}
                />
                <TabButton
                  title="Pending"
                  count={allGigs.filter((g) => g.status === "Pending").length}
                  isActive={activeTab === "Pending"}
                  onClick={() => setActiveTab("Pending")}
                />
              </div>

              {/* Gig List */}
              <div className="divide-y divide-gray-100">
                {filteredGigs.length > 0 ? (
                  filteredGigs.map((gig) => (
                    <GigManagementCard key={gig.id} gig={gig} />
                  ))
                ) : (
                  <p className="p-6 text-center text-gray-500">
                    No gigs in this category.
                  </p>
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
const GigManagementCard = ({ gig }: { gig: any }) => {
  const [isPaused, setIsPaused] = useState(gig.status === "Paused");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <img
          src={gig.imageUrl}
          alt={gig.title}
          className="aspect-video w-full flex-shrink-0 rounded-lg object-cover md:aspect-[4/3] md:w-32"
        />
        <div className="flex-grow">
          <p className="text-base font-medium text-gray-700 transition-colors hover:text-pink-600">
            {gig.title}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Starting at{" "}
            <span className="font-semibold text-gray-700">
              ₦{gig.price.toLocaleString()}
            </span>
          </p>
        </div>

        {/* Our Twist: Stats */}
        <div className="grid flex-shrink-0 grid-cols-3 gap-4 text-center md:text-left">
          <div>
            <p className="text-xs text-gray-500">Impressions</p>
            <p className="font-semibold text-gray-800">
              {gig.stats.impressions}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="font-semibold text-gray-800">{gig.stats.clicks}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quotes Sent</p>
            <p className="font-semibold text-gray-800">
              {gig.stats.quotesSent}
            </p>
          </div>
        </div>

        {/* Our Twist: Controls */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Status Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Activate Gig" : "Pause Gig"}
          >
            {isPaused ? (
              <ToggleLeft className="h-10 w-10 text-gray-400 hover:text-gray-600" />
            ) : (
              <ToggleRight className="h-10 w-10 text-green-500 hover:text-green-600" />
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
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-pink-600 hover:bg-pink-50">
                  <Trash2 className="h-4 w-4" /> Delete
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
