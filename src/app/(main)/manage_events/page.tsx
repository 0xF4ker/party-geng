"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Gift,
  MoreVertical,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  CalendarDays,
  Sparkles,
  DollarSign,
  CheckCircle,
  Armchair,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useUserType } from "@/hooks/useUserType";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddVendorModal } from "@/app/_components/event/modals/AddVendorModal";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";
import { format } from "date-fns";
type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getMyEvents"]["upcoming"][number];
const formatEventDate = (start: Date | string, end: Date | string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) {
    return format(s, "MMM d, yyyy");
  } else if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    return `${format(s, "MMM d")} - ${format(e, "d, yyyy")}`;
  } else if (s.getFullYear() === e.getFullYear()) {
    return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
  } else {
    return `${format(s, "MMM d, yyyy")} - ${format(e, "MMM d, yyyy")}`;
  }
};
const ClientEventPlannerPage = () => {
  const { user } = useAuth();
  const { isClient, loading } = useUserType();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<event | null>(null);
  const { data: eventsData, isLoading: eventsLoading } =
    api.event.getMyEvents.useQuery(undefined, {
      enabled: !!user,
    });
  useEffect(() => {
    if (!loading && !isClient) {
      router.push("/");
    }
  }, [loading, isClient, router]);
  const openAddVendor = (event: event) => {
    setSelectedEvent(event);
    setIsVendorModalOpen(true);
  };
  if (loading || !isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }
  return (
    <div className="bg-transparent pt-[122px] text-[var(--l-text)] lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-[var(--l-text)]">My Events</h1>
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] shadow-[0_4px_16px_rgba(247,37,133,0.3)] px-5 py-3 font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.02] md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Event
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--l-border)] pb-2">
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
        {/* Loading State */}
        {eventsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
          </div>
        )}
        {/* --- Upcoming Events --- */}
        {!eventsLoading && activeTab === "upcoming" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsData?.upcoming && eventsData.upcoming.length > 0 ? (
              eventsData.upcoming.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <EventCard
                    event={event}
                    onAddVendorClick={(e) => {
                      if (e) e.preventDefault();
                      openAddVendor(event);
                    }}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-full l-card p-12 text-center">
                <p className="text-[var(--l-text-muted)]">No upcoming events yet</p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="mt-4 font-semibold text-[var(--l-brand-pink)] hover:text-white transition-colors"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>
        )}
        {/* --- Past Events --- */}
        {!eventsLoading && activeTab === "past" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsData?.past && eventsData.past.length > 0 ? (
              eventsData.past.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <EventCard event={event} isPast={true} />
                </Link>
              ))
            ) : (
              <div className="col-span-full l-card p-12 text-center">
                <p className="text-[var(--l-text-muted)]">No past events</p>
              </div>
            )}
          </div>
        )}
      </div>
      {isEventModalOpen && (
        <CreateEventModal onClose={() => setIsEventModalOpen(false)} />
      )}
      {isVendorModalOpen && selectedEvent && (
        <AddVendorModal
          event={selectedEvent}
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
        />
      )}
    </div>
  );
};
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
      "rounded-full px-4 py-2 text-sm font-semibold transition-all sm:text-base",
      isActive
        ? "bg-[rgba(247,37,133,0.15)] text-[var(--l-brand-pink)] border border-[var(--l-brand-pink)] shadow-[0_0_12px_rgba(247,37,133,0.3)]"
        : "border border-transparent text-[var(--l-text-muted)] hover:bg-black/5 hover:text-[var(--l-text)]",
    )}
  >
    {title}
  </button>
);
const EventCard = ({
  event,
  onAddVendorClick,
  isPast = false,
}: {
  event: event;
  onAddVendorClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isPast?: boolean;
}) => {
  const wishlistItems = event.wishlist?.items ?? [];
  const wishlistCount = wishlistItems.length;
  const fulfilledCount = wishlistItems.filter(
    (item) => item.isFulfilled,
  ).length;
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();
  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
    },
  });
  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
    },
  });
  const handleTogglePublic = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    updateEvent.mutate({ id: event.id, isPublic: newIsPublic });
  };
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEvent.mutate({ id: event.id });
      setIsMenuOpen(false);
    }
  };
  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };
  const hiredVendors =
    event.hiredVendors?.map((ev) => ({
      id: ev.vendor.id,
      name:
        ev.vendor.vendorProfile?.companyName ?? ev.vendor.username ?? "Vendor",
      avatarUrl:
        ev.vendor.vendorProfile?.avatarUrl ??
        "https://placehold.co/40x40/ec4899/ffffff?text=V",
    })) ?? [];
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
    <div className="flex h-full flex-col overflow-hidden l-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <Image
        src={
          event.coverImage ??
          "https://placehold.co/600x300/ec4899/ffffff?text=Event"
        }
        alt={event.title}
        className={cn("h-40 w-full object-cover", isPast && "grayscale")}
        width={600}
        height={300}
      />
      <div className="flex grow flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                isPast ? "text-[var(--l-text-muted)]" : "text-[var(--l-brand-pink)]",
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {/* DISPLAY RANGE DATE */}
              {formatEventDate(event.startDate, event.endDate)}
            </p>
            <h3 className="mt-1 line-clamp-1 text-xl font-bold text-[var(--l-text)]">
              {event.title}
            </h3>
          </div>
          {!isPast && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuToggle}
                className="rounded-full p-1 text-[var(--l-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {isMenuOpen && (
                <div
                  className="absolute top-full right-0 z-10 mt-1 w-48 rounded-xl border border-[var(--l-border)] bg-[var(--l-surface-raised)] shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/event/${event.id}/wishlist`}>
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--l-text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                      <Gift className="h-4 w-4 text-[var(--l-text-muted)]" /> Manage Wishlist
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      if (onAddVendorClick) onAddVendorClick(e);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--l-text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <Users className="h-4 w-4 text-[var(--l-text-muted)]" /> Add Vendor
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#ff4d4d] hover:bg-[rgba(255,77,77,0.1)] transition-colors disabled:opacity-50"
                  >
                    {deleteEvent.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-auto space-y-3 pt-4">
          <div>
            <h4 className="mb-2 text-[10px] font-bold text-[var(--l-text-muted)] uppercase tracking-wider">
              Hired Vendors ({hiredVendors.length})
            </h4>
            <div className="flex items-center gap-2">
              {hiredVendors.slice(0, 3).map((vendor) => (
                <Image
                  key={vendor.id}
                  src={vendor.avatarUrl}
                  alt={vendor.name}
                  title={vendor.name}
                  className="h-8 w-8 rounded-full border-2 border-[var(--l-surface-raised)] ring-1 ring-[var(--l-border)]"
                  width={32}
                  height={32}
                />
              ))}
              {!isPast && (
                <button
                  onClick={onAddVendorClick}
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--l-surface-raised)] bg-[rgba(255,255,255,0.05)] text-[var(--l-text-muted)] ring-1 ring-[var(--l-border)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {!isPast && wishlistCount > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--l-border)] pt-3">
              <div className="text-xs text-[var(--l-text-muted)]">
                Wishlist:{" "}
                <span className="font-semibold text-white">
                  {wishlistCount}
                </span>{" "}
                items
              </div>
              <div className="text-xs font-semibold text-[#16a34a]">
                {fulfilledCount} fulfilled
              </div>
            </div>
          )}
        </div>
        {!isPast && (
          <div className="mt-4 border-t border-[var(--l-border)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--l-text-muted)]">
                Make Public
              </span>
              <button
                onClick={handleTogglePublic}
                disabled={updateEvent.isPending}
                className="transition-transform hover:scale-110"
              >
                {isPublic ? (
                  <ToggleRight className="h-8 w-8 text-[var(--l-brand-pink)] drop-shadow-[0_0_8px_rgba(247,37,133,0.5)]" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-[var(--l-text-muted)]" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const CreateEventModal = ({ onClose }: { onClose: () => void }) => {
  const utils = api.useUtils();
  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Anniversary");

  // Step 2: Logistics & Admissions
  const [expectedGuests, setExpectedGuests] = useState<number>(0);
  const [expectedTables, setExpectedTables] = useState<number>(0);
  const [roughBudget, setRoughBudget] = useState<number>(0);
  const [requestCoordinator, setRequestCoordinator] = useState(false);
  const [isTicketed, setIsTicketed] = useState(false);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [rsvpButtonTitle, setRsvpButtonTitle] = useState("Attend");
  const [ticketTiers, setTicketTiers] = useState<Array<{ name: string; price: number; description?: string }>>([
    { name: "General Admission", price: 5000, description: "" }
  ]);

  // Step 3: Choose your poster!
  const [coverImage, setCoverImage] = useState<string>(
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80"
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 4: Theme & Preview
  const [selectedTheme, setSelectedTheme] = useState(
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
  );

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create event");
    },
  });

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    if (!endDate || new Date(endDate) < new Date(val)) {
      setEndDate(val);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!eventName.trim()) {
        toast.error("Event name is a required field");
        return;
      }
      if (!startDate || !endDate) {
        toast.error("Please select a valid start and end date");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const generateAiDescription = () => {
    if (!eventName.trim()) {
      toast.error("Please enter an event name first!");
      return;
    }
    const templates = [
      `Get ready to celebrate ${eventName}! Join us for an amazing gathering filled with laughter, great music, and unforgettable memories. We can't wait to share this special moment with all of you. RSVP below!`,
      `You are cordially invited to ${eventName}. We are bringing together our favorite people for a beautiful celebration. Please save the date and let us know if you'll be attending.`,
      `It's time for ${eventName}! We're creating a premium celebratory experience with good food, drinks, and awesome vibes. Confirm your slot and come party with us!`,
    ];
    const randomDesc = templates[Math.floor(Math.random() * templates.length)]!;
    setDescription(randomDesc);
    toast.success("AI description generated! ✨");
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setCoverImage(reader.result);
        toast.success("Custom poster uploaded from gallery!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createEvent.mutate({
      title: eventName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location,
      coverImage: coverImage,
      isTicketed,
      ticketPrice: isTicketed && ticketTiers.length > 0 ? ticketTiers[0]!.price : 0,
      ticketTiers: isTicketed ? ticketTiers : [],
      questionnaireData: {
        eventType,
        description,
        expectedGuests,
        expectedTables,
        roughBudget,
        requestCoordinator,
        rsvpButtonTitle,
        selectedTheme,
      },
    });
  };

  const PRESET_POSTERS = [
    {
      id: "poster1",
      title: "You Are Invited",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: "poster2",
      title: "Be Our Guest",
      url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: "poster3",
      title: "Sunset Party",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    },
  ];

  const PRESET_GRADIENTS = [
    { name: "Slate Mist", value: "linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)" },
    { name: "Sunset Pink", value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
    { name: "Cosmic Glow", value: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
    { name: "Fresh Coral", value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
    { name: "Ocean Breeze", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { name: "Spicy Orange", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
    { name: "Purple Haze", value: "linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)" },
    { name: "Sunny Gold", value: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)" },
    { name: "Soft Mint", value: "linear-gradient(135deg, #84ffc9 0%, #aab2ff 100%)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-[32px] bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden text-gray-900 flex flex-col max-h-[90vh] relative">
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header / Progress bar */}
        <div className="relative pt-6 px-6 pb-2">
          {/* Progress bar line */}
          <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 hover:text-gray-800 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <div>{step}/4</div>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            /* STEP 1: BASICS */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Bring your moment to life</h2>
                <p className="text-sm text-gray-500">
                  Fill in the details to craft your perfect {eventType} and create lasting memories.
                </p>
              </div>

              {/* Event Type Grid Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Celebration Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Anniversary", "Wedding", "Birthday", "Concert", "Private", "Custom"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEventType(t)}
                      className={`rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                        eventType === t
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Name Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder={`Give this ${eventType} a name`}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              {/* Start & End Dates */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Date + Time
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      Start
                    </span>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={handleStartChange}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-14 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:light]"
                      required
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      End
                    </span>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-14 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none cursor-pointer [color-scheme:light]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Location
                </label>
                <div className="[&>div>input]:bg-gray-50/50 [&>div>input]:border-gray-200 [&>div>input]:text-gray-900 [&>div>input]:rounded-2xl [&>div>input]:py-3.5 [&>div>input]:placeholder-gray-400">
                  <LocationSearchInput onLocationSelect={setLocation} />
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Describe your event
                  </label>
                  <button
                    type="button"
                    onClick={generateAiDescription}
                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-650 px-3 py-1 text-[11px] font-bold text-white hover:opacity-90 transition animate-pulse"
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate ✨
                  </button>
                </div>
                <textarea
                  placeholder="What would you like to say about it (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none min-h-[90px] resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            /* STEP 2: LOGISTICS & ADMISSION (STREAMLINED) */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Event Setup & Logistics</h2>
                <p className="text-sm text-gray-500">
                  Configure admission prices, coordinator booking, and guest logistics.
                </p>
              </div>

              {/* Guest / Budget fields */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Capacity & Budget Details
                </label>

                {/* Expected Attendees */}
                <label className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4 cursor-pointer hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3 text-gray-700 text-sm font-semibold">
                    <Users className="h-5 w-5 text-gray-400" />
                    Expected Guest Capacity
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={expectedGuests || ""}
                    onChange={(e) => setExpectedGuests(Number(e.target.value))}
                    className="w-20 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-bold"
                  />
                </label>

                {/* Expected Tables */}
                <label className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4 cursor-pointer hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3 text-gray-700 text-sm font-semibold">
                    <Armchair className="h-5 w-5 text-gray-400" />
                    Number of seating tables
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={expectedTables || ""}
                    onChange={(e) => setExpectedTables(Number(e.target.value))}
                    className="w-20 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-bold"
                  />
                </label>

                {/* Rough Budget */}
                <label className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4 cursor-pointer hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3 text-gray-700 text-sm font-semibold">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    A rough budget (₦)
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={roughBudget || ""}
                    onChange={(e) => setRoughBudget(Number(e.target.value))}
                    className="w-32 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-bold"
                  />
                </label>
              </div>

              {/* Coordinator requested collaboration option */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Platform Collaboration
                </label>
                <div className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4">
                  <div className="space-y-0.5 max-w-[80%]">
                    <h4 className="text-sm font-bold text-gray-800">
                      Request Coordinator Collaboration 🤝
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Hire a certified platform coordinator to help oversee vendor checkout, checklist tasks, and budgeting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestCoordinator(!requestCoordinator)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requestCoordinator ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        requestCoordinator ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Ticketing Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Admission RSVP settings
                </label>
                
                <div className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-gray-800">Enable Ticketing RSVP</h4>
                    <p className="text-[11px] text-gray-500">
                      Sell entry admission tickets. Funds are processed via Paystack.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTicketed(!isTicketed)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isTicketed ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isTicketed ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {isTicketed && (
                  <div className="border border-gray-150 bg-gray-50/30 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-3 duration-250">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-800">Configure Ticket Tiers</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTicketTiers([
                            ...ticketTiers,
                            { name: "", price: 5000, description: "" },
                          ])
                        }
                        className="text-xs font-bold text-blue-650 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {ticketTiers.map((tier, idx) => (
                        <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 relative">
                          {ticketTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTicketTiers(ticketTiers.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                placeholder="Tier Name (e.g. VIP)"
                                value={tier.name}
                                onChange={(e) => {
                                  const updated = [...ticketTiers];
                                  updated[idx]!.name = e.target.value;
                                  setTicketTiers(updated);
                                }}
                                className="w-full text-xs bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none text-gray-950 font-bold py-1"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Price (₦)"
                                value={tier.price || ""}
                                onChange={(e) => {
                                  const updated = [...ticketTiers];
                                  updated[idx]!.price = Number(e.target.value);
                                  setTicketTiers(updated);
                                }}
                                className="w-full text-xs text-right bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none text-gray-950 font-bold py-1"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <input
                              placeholder="Description (e.g. Backstage access)"
                              value={tier.description || ""}
                              onChange={(e) => {
                                const updated = [...ticketTiers];
                                updated[idx]!.description = e.target.value;
                                setTicketTiers(updated);
                              }}
                              className="w-full text-[10px] text-gray-500 bg-transparent border-b border-gray-150 focus:border-blue-500 focus:outline-none py-0.5"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RSVP Button Text Selection */}
                <div className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-2xl p-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-gray-800">RSVP Button Label</h4>
                    <p className="text-[11px] text-gray-500">
                      The action title guests see on your invitations.
                    </p>
                  </div>
                  <select
                    value={rsvpButtonTitle}
                    onChange={(e) => setRsvpButtonTitle(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 p-2.5 outline-none cursor-pointer"
                  >
                    {["Attend", "Register", "Join", "Buy Ticket", "RSVP"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            /* STEP 3: CHOOSE YOUR POSTER */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Choose your poster!</h2>
                <p className="text-sm text-gray-500">
                  Select a poster for your event that guests will see when you share your event.
                </p>
              </div>

              {/* Upload & Preset Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Upload card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50/20 hover:bg-gray-50/50 hover:border-blue-300 transition rounded-2xl h-44 cursor-pointer p-4 text-center group"
                >
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition mb-2" />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-800 transition">
                    Upload from Gallery
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Preset cards */}
                {PRESET_POSTERS.map((poster) => (
                  <div
                    key={poster.id}
                    onClick={() => setCoverImage(poster.url)}
                    className={`relative rounded-2xl h-44 overflow-hidden cursor-pointer border-2 transition ${
                      coverImage === poster.url ? "border-blue-500 scale-[0.98]" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poster.url} alt={poster.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <span className="text-xs font-extrabold text-white">{poster.title}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Poster Preview */}
              <div className="rounded-2xl border border-gray-150 bg-gray-50/50 p-3 flex items-center gap-3">
                <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-gray-150 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="selected poster" className="h-full w-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected Poster</span>
                  <p className="text-sm font-semibold text-gray-700 truncate max-w-sm">
                    {coverImage.startsWith("data:image") ? "Custom Uploaded Cover" : "Template Cover Active"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            /* STEP 4: THEME & LIVE INVITATION PREVIEW (INTERACTIVE) */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight font-sans">Choose Theme & Preview</h2>
                <p className="text-sm text-gray-500">
                  Swipe through stunning themes and preview how your public invitation page will look.
                </p>
              </div>

              {/* Theme Gradients Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Select Theme Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_GRADIENTS.map((grad, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedTheme(grad.value)}
                      style={{ background: grad.value }}
                      className={`h-12 rounded-xl cursor-pointer border-2 transition-all relative ${
                        selectedTheme === grad.value
                          ? "border-slate-800 scale-[0.96] shadow-[0_0_12px_rgba(0,0,0,0.15)]"
                          : "border-transparent hover:scale-102"
                      }`}
                    >
                      {selectedTheme === grad.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-white/30 backdrop-blur-md p-1">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* LIVE INVITATION CARD PREVIEW */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Public Invitation Preview
                </label>
                
                {/* Mock Card Container */}
                <div 
                  className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col transition-all duration-300"
                  style={{ background: selectedTheme }}
                >
                  {/* Poster header within mock card */}
                  <div className="h-32 w-full relative overflow-hidden bg-black/10 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={coverImage} 
                      alt="Mock Poster" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60" 
                    />
                    <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-bold tracking-wider uppercase">
                      {eventType}
                    </div>
                  </div>

                  {/* Card details */}
                  <div className="p-4 text-white space-y-2">
                    <h3 className="text-lg font-black tracking-tight truncate">
                      {eventName || "My Spectacular Celebration"}
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1">
                      📍 {location?.display_name || "Location not set yet"}
                    </p>
                    <p className="text-[10px] text-white/70 line-clamp-2 italic leading-relaxed">
                      {description || "No description provided. Click Generate in step 1 to write one!"}
                    </p>

                    {/* RSVP Action button in preview */}
                    <div className="pt-2">
                      <div className="w-full bg-white text-slate-900 py-2 rounded-xl text-center text-xs font-extrabold shadow-md hover:opacity-90 transition">
                        {rsvpButtonTitle} {isTicketed ? `(₦${(ticketTiers[0]?.price ?? 5000).toLocaleString()})` : "(Free)"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Footer */}
        <div className="border-t border-gray-100 bg-gray-50/30 p-6 flex gap-3">
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-full bg-slate-900 hover:bg-slate-800 py-4 text-sm font-black text-white tracking-tight transition duration-200 flex items-center justify-center gap-1.5"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createEvent.isPending || (isTicketed && (ticketTiers.length === 0 || !ticketTiers[0]?.price))}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 py-4 text-sm font-black text-white tracking-tight transition duration-200 flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {createEvent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ClientEventPlannerPage;
