"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Paperclip,
  Send,
  MoreVertical,
  FileText,
  CheckCircle,
  X,
  Eye,
  RefreshCw,
  Copy,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ShieldCheck,
  PartyPopper, // For fun
  CreditCard, // For pay
  HandHeart, // For promise
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
// This data would be fetched based on the page's unique URL
const eventDetails = {
  id: 1,
  title: "Adebayo's 30th Birthday Bash",
  date: "December 15, 2025",
  hostName: "Adebayo P.",
  hostAvatar: "https://placehold.co/128x128/3b82f6/ffffff?text=A",
  coverImage:
    "https://placehold.co/1200x400/ec4899/ffffff?text=30th+Birthday+Bash",
  welcomeMessage:
    "So excited to celebrate with you all! I've put together a small wishlist for things that would make the party even more amazing. No pressure at all, but if you'd like to contribute, here are a few ideas. Can't wait to see you there!",
  wishlistItems: [
    {
      id: 1,
      name: "Bottle of Veuve Clicquot",
      price: 65000,
      promisors: ["Chioma E.", "Tunde O."],
      isFulfilled: false,
    },
    {
      id: 2,
      name: "Professional Fog Machine",
      price: 40000,
      promisors: [],
      isFulfilled: false,
    },
    {
      id: 3,
      name: "Custom Neon Sign ('Adebayo 30')",
      price: 80000,
      promisors: ["Chioma E."],
      isFulfilled: true,
    },
    {
      id: 4,
      name: "Sparklers (Pack of 50)",
      price: 15000,
      promisors: ["Wale K."],
      isFulfilled: false,
    },
  ],
};
// --- End Mock Data ---

// --- Main Page Component ---
const PublicWishlistPage = () => {
  // We'll use state to manage the items so we can "promise" them
  const [items, setItems] = useState(eventDetails.wishlistItems);

  // This is a mock function for a guest promising an item
  const handlePromiseItem = (itemId) => {
    // This would normally be a backend call, and you'd know the guest's name
    const guestName = "You";

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === itemId && !item.promisors.includes(guestName)) {
          return { ...item, promisors: [...item.promisors, guestName] };
        }
        return item;
      }),
    );
  };

  // This would navigate to a payment modal or page
  const handlePay = (item) => {
    alert(
      `Redirecting to payment for: ${item.name} (₦${item.price.toLocaleString()})`,
    );
  };

  return (
    // This page is standalone, so no sticky header padding
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* --- Event Header --- */}
      <div className="bg-white shadow-sm">
        <div
          className="h-48 bg-cover bg-center md:h-64"
          style={{ backgroundImage: `url(${eventDetails.coverImage})` }}
        ></div>
        <div className="container mx-auto -mt-16 max-w-4xl px-4 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-6 shadow-lg md:flex-row">
            <img
              src={eventDetails.hostAvatar}
              alt={eventDetails.hostName}
              className="-mt-16 h-24 w-24 flex-shrink-0 rounded-full border-4 border-white shadow-md md:-mt-0 md:-ml-16"
            />
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-pink-600">
                You're invited to
              </p>
              <h1 className="text-3xl font-bold text-gray-800">
                {eventDetails.title}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                <Calendar className="mr-2 inline-block h-5 w-5" />
                {eventDetails.date}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {/* Welcome Message */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <p className="text-center leading-relaxed text-gray-700 italic">
            "{eventDetails.welcomeMessage}"
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onPromise={handlePromiseItem}
              onPay={handlePay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const WishlistItemCard = ({ item, onPromise, onPay }) => {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
        item.isFulfilled && "bg-gray-50 opacity-70",
      )}
    >
      <div className="flex flex-grow flex-col p-5">
        {/* Status Badge */}
        {item.isFulfilled ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle className="h-4 w-4" />
            Fulfilled!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Gift className="h-4 w-4" />
            Still Needed
          </span>
        )}

        <h3
          className={cn(
            "mt-3 text-xl font-bold text-gray-800",
            item.isFulfilled && "text-gray-500 line-through",
          )}
        >
          {item.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Est. Price: ₦{item.price.toLocaleString()}
        </p>

        {/* Promisors List */}
        <div className="mt-4 flex-grow border-t border-gray-100 pt-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
            Promised By:
          </h4>
          {item.promisors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.promisors.map((name, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700"
                >
                  <HandHeart className="h-4 w-4 text-pink-500" />
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No promises yet.</p>
          )}
        </div>

        {/* Actions */}
        {!item.isFulfilled && (
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <button
              onClick={() => onPromise(item.id)}
              disabled={item.promisors.includes("You")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md bg-pink-100 px-4 py-2.5 font-bold text-pink-700 transition-colors hover:bg-pink-200",
                item.promisors.includes("You") &&
                  "cursor-not-allowed opacity-60",
              )}
            >
              <HandHeart className="h-5 w-5" />
              {item.promisors.includes("You")
                ? "You Promised!"
                : "I'll Promise This"}
            </button>
            <button
              onClick={() => onPay(item)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-gray-900"
            >
              <CreditCard className="h-5 w-5" />
              Contribute or Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWishlistPage;
