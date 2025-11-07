"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  Users,
  Plus,
  // Image as ImageIcon,
  Search,
  Gift,
  MoreVertical,
  CheckCircle,
  X,
  Copy, // Added
  ToggleLeft, // Added
  ToggleRight, // Added
  Trash2, // Added
  ShieldCheck, // Added
} from "lucide-react";
import Image from "next/image";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const clientEvents = [
  {
    id: 1,
    title: "Adebayo's 30th Birthday Bash",
    date: "December 15, 2025",
    isPublic: true,
    coverImage:
      "https://placehold.co/600x300/ec4899/ffffff?text=30th+Birthday+Bash",
    hiredVendors: [
      {
        id: 1,
        name: "DJ SpinMaster",
        avatarUrl: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
      },
      {
        id: 2,
        name: "SnapPro",
        avatarUrl: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
      },
      {
        id: 3,
        name: "Cakes 'n' Bakes",
        avatarUrl: "https://placehold.co/40x40/f59e0b/ffffff?text=C",
      },
    ],
    // FIX: Updated Wishlist data structure
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
        promisors: [],
        isFulfilled: false,
      },
    ],
  },
  {
    id: 2,
    title: "End of Year Corporate Party 2024",
    date: "December 20, 2024",
    isPublic: false,
    coverImage:
      "https://placehold.co/600x300/8b5cf6/ffffff?text=Corporate+Party",
    hiredVendors: [
      {
        id: 1,
        name: "Lagos Party Band",
        avatarUrl: "https://placehold.co/40x40/3b82f6/ffffff?text=L",
      },
    ],
    wishlistItems: [],
  },
];

const pastEvents = [
  {
    id: 3,
    title: "Chioma's Wedding",
    date: "October 26, 2024",
    coverImage: "https://placehold.co/600x300/10b981/ffffff?text=Wedding",
    hiredVendors: [],
    wishlistItems: [],
  },
];

// NEW: Mock data for vendors the client has active orders with
const activeVendors = [
  {
    id: 1,
    name: "DJ SpinMaster",
    service: "Wedding DJ",
    avatarUrl: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
    isAdded: true,
  },
  {
    id: 2,
    name: "SnapPro",
    service: "Photographer",
    avatarUrl: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
    isAdded: true,
  },
  {
    id: 3,
    name: "Cakes 'n' Bakes",
    service: "Catering",
    avatarUrl: "https://placehold.co/40x40/f59e0b/ffffff?text=C",
    isAdded: true,
  },
  {
    id: 4,
    name: "Lagos Party Band",
    service: "Live Band",
    avatarUrl: "https://placehold.co/40x40/3b82f6/ffffff?text=L",
    isAdded: false,
  }, // Not added to this event
];
// --- End Mock Data ---

interface HiredVendor {
  id: number;
  name: string;
  avatarUrl: string;
}

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  promisors: string[];
  isFulfilled: boolean;
}

interface ClientEvent {
  id: number;
  title: string;
  date: string;
  isPublic?: boolean;
  coverImage: string;
  hiredVendors: HiredVendor[];
  wishlistItems: WishlistItem[];
}

interface ActiveVendor {
  id: number;
  name: string;
  service: string;
  avatarUrl: string;
  isAdded: boolean;
}

// --- Main Page Component ---
const ClientEventPlannerPage = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClientEvent | null>(null);

  const openWishlist = (event: ClientEvent) => {
    setSelectedEvent(event);
    setIsWishlistOpen(true);
  };

  const openAddVendor = (event: ClientEvent) => {
    setSelectedEvent(event);
    setIsVendorModalOpen(true);
  };

  const closeWishlist = () => {
    setIsWishlistOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-800">My Events</h1>
          {/* FIX: Button now opens modal */}
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-pink-700 md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Event
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center border-b border-gray-200">
          <TabButton
            title="Upcoming Events"
            isActive={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
          />
          <TabButton
            title="Past Events"
            isActive={activeTab === "past"}
            onClick={() => setActiveTab("past")}
          />
        </div>

        {/* --- Tab Content: Upcoming Events --- */}
        {activeTab === "upcoming" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clientEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onWishlistClick={() => openWishlist(event)}
                onAddVendorClick={() => openAddVendor(event)}
              />
            ))}
          </div>
        )}

        {/* --- Tab Content: Past Events --- */}
        {activeTab === "past" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} isPast={true} />
            ))}
          </div>
        )}
      </div>

      {/* --- Wishlist Modal --- */}
      {isWishlistOpen && selectedEvent && (
        <WishlistModal event={selectedEvent} onClose={closeWishlist} />
      )}

      {/* --- Create Event Modal --- */}
      {isEventModalOpen && (
        <CreateEventModal onClose={() => setIsEventModalOpen(false)} />
      )}

      {/* --- Add Vendor Modal --- */}
      {isVendorModalOpen && selectedEvent && (
        <AddVendorModal
          event={selectedEvent}
          onClose={() => setIsVendorModalOpen(false)}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const TabButton = ({
  title,
  isActive,
  onClick,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-1 py-3 text-sm font-semibold transition-colors sm:px-4 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {title}
  </button>
);

const EventCard = ({
  event,
  onWishlistClick,
  onAddVendorClick,
  isPast = false,
}: {
  event: ClientEvent;
  onWishlistClick?: () => void;
  onAddVendorClick?: () => void;
  isPast?: boolean;
}) => {
  const wishlistCount = event.wishlistItems.length;
  // FIX: Changed from promisedCount to fulfilledCount
  const fulfilledCount = event.wishlistItems.filter(
    (item: WishlistItem) => item.isFulfilled,
  ).length;
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <Image
        src={event.coverImage}
        alt={event.title}
        className="h-40 w-full object-cover"
        width={600}
        height={300}
      />
      <div className="flex grow flex-col p-5">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-pink-600">{event.date}</p>
            <h3 className="mt-1 text-xl font-bold text-gray-800">
              {event.title}
            </h3>
          </div>
          {/* FIX: More Menu */}
          {!isPast && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-700"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {isMenuOpen && (
                <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={() => {
                      onWishlistClick?.();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Gift className="h-4 w-4" /> Manage Wishlist
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(false)} // Placeholder for Manage Vendors page
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Users className="h-4 w-4" /> Manage Vendors
                  </button>
                  <button
                    onClick={() => {
                      alert("Event Deleted!");
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {/* Hired Vendors */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
              Hired Vendors ({event.hiredVendors.length})
            </h4>
            <div className="flex items-center gap-2">
              {event.hiredVendors.slice(0, 3).map((vendor: HiredVendor) => (
                <Image
                  key={vendor.id}
                  src={vendor.avatarUrl}
                  alt={vendor.name}
                  title={vendor.name}
                  className="h-10 w-10 rounded-full border-2 border-white ring-1 ring-gray-200"
                  width={40}
                  height={40}
                />
              ))}
              {!isPast && (
                <button
                  onClick={onAddVendorClick}
                  className="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Wishlist Stats */}
          {!isPast && wishlistCount > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                Wishlist
              </h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {wishlistCount}
                  </p>
                  <p className="text-sm text-gray-500">Items</p>
                </div>
                {/* FIX: Changed to "Fulfilled" */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {fulfilledCount}
                  </p>
                  <p className="text-sm text-gray-500">Fulfilled</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isPast && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Make Public
              </span>
              <button onClick={() => setIsPublic(!isPublic)}>
                {isPublic ? (
                  <ToggleRight className="h-10 w-10 text-pink-600" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MODAL COMPONENTS ---

const WishlistModal = ({
  event,
  onClose,
}: {
  event: ClientEvent;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  // FIX: Add state to manage wishlist items locally for toggling
  const [items, setItems] = useState<WishlistItem[]>(event.wishlistItems);

  const copyLink = async () => {
    // This is a mock link. In a real app, this would be a unique URL.
    const textToCopy = `https://partygeng.com/events/${event.id}/wishlist`;

    // Fallback for non-navigator.clipboard environments
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for http or iframes
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      console.error(err);
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  // FIX: Add handler to toggle fulfillment
  const handleToggleFulfilled = (itemId: number) => {
    setItems((currentItems: WishlistItem[]) =>
      currentItems.map((item: WishlistItem) =>
        item.id === itemId ? { ...item, isFulfilled: !item.isFulfilled } : item,
      ),
    );
    // In a real app, you would also send this update to your backend
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newItemName = (form.elements.namedItem("newItem") as HTMLInputElement)
      ?.value;
    const newItemPrice = (
      form.elements.namedItem("newItemPrice") as HTMLInputElement
    )?.value;
    if (!newItemName || !newItemPrice) return;

    const newItem: WishlistItem = {
      id: items.length + 100, // mock new id
      name: newItemName,
      price: Number(newItemPrice),
      promisors: [],
      isFulfilled: false,
    };
    setItems([...items, newItem]);
    form.reset();
  };

  const handleRemoveItem = (itemId: number) => {
    setItems((currentItems: WishlistItem[]) =>
      currentItems.filter((item: WishlistItem) => item.id !== itemId),
    );
    // In a real app, send this delete request to backend
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="m-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h3 className="text-xl font-semibold">Event Wishlist</h3>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FIX: Re-added Shareable Link Section */}
        <div className="shrink-0 border-b border-gray-200 p-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Share Your Wishlist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`partygeng.com/events/${event.id}/wishlist`}
              className="w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-sm"
            />
            <button
              onClick={copyLink}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white",
                copied ? "bg-green-600" : "bg-pink-600 hover:bg-pink-700",
              )}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="overflow-y-auto p-4">
          <h4 className="mb-3 font-semibold text-gray-800">Wishlist Items</h4>
          {/* FIX: Updated list to show new logic */}
          <ul className="divide-y divide-gray-100">
            {items.map((item: WishlistItem) => (
              <li key={item.id} className="flex items-start gap-4 py-3">
                {/* Checkbox for Owner */}
                <input
                  type="checkbox"
                  checked={item.isFulfilled}
                  onChange={() => handleToggleFulfilled(item.id)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <div className="grow">
                  <p
                    className={cn(
                      "font-medium text-gray-800",
                      item.isFulfilled && "text-gray-500 line-through",
                    )}
                  >
                    {item.name}
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      item.isFulfilled ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    Est. Price: ₦{item.price.toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.isFulfilled ? (
                    <span className="flex items-center gap-1.5 font-semibold text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Fulfilled!
                    </span>
                  ) : item.promisors.length > 0 ? (
                    <div>
                      <p className="font-semibold text-blue-600">Promised</p>
                      <p className="text-xs text-gray-500">
                        by {item.promisors.join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-400">
                      Not yet promised
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
            {/* Add new item */}
            <li className="py-4">
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={handleAddItem}
              >
                <input
                  type="text"
                  name="newItem"
                  placeholder="Add new item name"
                  className="grow rounded-md border border-gray-300 p-2 text-sm"
                  aria-label="New item name"
                />
                <input
                  type="number"
                  name="newItemPrice"
                  placeholder="Price (₦)"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm sm:w-32"
                  aria-label="New item price"
                />
                <button
                  type="submit"
                  className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Add Item
                </button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// NEW: Create Event Modal
const CreateEventModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="m-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Create a New Event</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          <div>
            <label
              htmlFor="eventName"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Event Title
            </label>
            <input
              type="text"
              id="eventName"
              placeholder="e.g. My 30th Birthday Bash"
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
            />
          </div>
          <div>
            <label
              htmlFor="eventDate"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Event Date
            </label>
            <input
              type="date"
              id="eventDate"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="mr-2 rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onClose} // In real app, this would submit
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

// NEW: Add Vendor Modal
const AddVendorModal = ({
  event,
  onClose,
}: {
  event: ClientEvent;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="m-4 flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h3 className="text-xl font-semibold">Add Vendor to Event</h3>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your active vendors..."
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-3 pl-10 text-sm focus:outline-pink-500"
            />
          </div>
        </div>

        {/* Vendor List */}
        <div className="overflow-y-auto p-2">
          <h4 className="mb-2 px-2 font-semibold text-gray-800">
            Vendors with Active Orders
          </h4>
          <ul className="divide-y divide-gray-100">
            {activeVendors.map((vendor: ActiveVendor) => (
              <li
                key={vendor.id}
                className="flex items-center justify-between px-2 py-3"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={vendor.avatarUrl}
                    alt={vendor.name}
                    className="h-10 w-10 rounded-full"
                    width={40}
                    height={40}
                  />
                  <div>
                    <p className="font-medium text-gray-800">{vendor.name}</p>
                    <p className="text-sm text-gray-500">{vendor.service}</p>
                  </div>
                </div>
                {vendor.isAdded ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                    <ShieldCheck className="h-5 w-5" />
                    Added
                  </span>
                ) : (
                  <button className="rounded-md bg-pink-100 px-3 py-1.5 text-sm font-semibold text-pink-700 hover:bg-pink-200">
                    Add to Event
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientEventPlannerPage;
