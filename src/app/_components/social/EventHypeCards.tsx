"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Flame, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-orange-400 to-pink-500",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-400 to-teal-500",
  "from-blue-500 to-indigo-600",
];

function getEventGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[idx]!;
}

function getEventEmoji(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("beach") || lower.includes("pool") || lower.includes("summer")) return "🏖️";
  if (lower.includes("tech") || lower.includes("code") || lower.includes("meetup")) return "💻";
  if (lower.includes("wedding") || lower.includes("marriage") || lower.includes("reception")) return "💒";
  if (lower.includes("birthday") || lower.includes("bash") || lower.includes("cake")) return "🎂";
  if (lower.includes("music") || lower.includes("concert") || lower.includes("show")) return "🎵";
  if (lower.includes("drink") || lower.includes("cocktail") || lower.includes("party")) return "🍸";
  if (lower.includes("food") || lower.includes("pizza") || lower.includes("dinner")) return "🍕";
  return "🎉";
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function EventHypeCards() {
  const { user, isAuthenticated } = useAuth();
  const utils = api.useUtils();

  // Fetch real upcoming public events
  const { data: upcomingEvents = [], isLoading } =
    api.event.getUpcomingEvents.useQuery();

  // Mutation to attend public events
  const attendMutation = api.event.toggleAttendPublicEvent.useMutation({
    onSuccess: (data) => {
      if (data.attending) {
        toast.success("You are now registered as attending!");
      } else {
        toast.success("RSVP cancelled.");
      }
      void utils.event.getUpcomingEvents.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update RSVP");
    },
  });

  const handleAttendToggle = (eventId: string) => {
    if (!isAuthenticated) {
      toast("Login required to RSVP to events");
      return;
    }
    attendMutation.mutate({ eventId });
  };

  const processedEvents = useMemo(() => {
    return upcomingEvents.map((event) => {
      const attendeesCount = event.guestLists.reduce(
        (sum, list) =>
          sum + list.guests.filter((g) => g.status === "ATTENDING").length,
        0
      );
      
      const isUserAttending = event.guestLists.some((list) =>
        list.guests.some(
          (g) => g.email === user?.email && g.status === "ATTENDING"
        )
      );

      const startDate = new Date(event.startDate);
      const formattedDate = startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const daysToGo = getDaysUntil(startDate);
      const gradient = getEventGradient(event.id);
      const emoji = getEventEmoji(event.title);
      
      // Default capacity
      const capacity = 150;
      const fillPercent = Math.min(100, Math.round((attendeesCount / capacity) * 100));

      return {
        ...event,
        formattedDate,
        attendeesCount,
        isUserAttending,
        daysToGo,
        gradient,
        emoji,
        capacity,
        fillPercent,
      };
    });
  }, [upcomingEvents, user?.email]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[280px] sm:min-w-[320px] h-[280px] rounded-2xl bg-gray-100 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (processedEvents.length === 0) {
    return null; // hide the section if no events are fetched/created
  }

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#f72585]" />
            <h2 className="text-lg font-bold text-[var(--l-text)]">
              Upcoming Events
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-[var(--l-text-muted)]">
            See what the community is planning next
          </p>
        </div>
        <Link
          href="/manage_events"
          className="group flex items-center gap-1 text-sm font-medium text-[#f72585] transition-colors hover:text-[#7209b7]"
        >
          See All
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide">
        {processedEvents.map((event) => (
          <div
            key={event.id}
            className="min-w-[280px] sm:min-w-[320px] snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex-shrink-0 bg-white border border-[var(--l-border)]"
          >
            {/* Top Cover Section */}
            <div className="relative h-28 w-full overflow-hidden flex items-center justify-center">
              {event.coverImage ? (
                <>
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                </>
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", event.gradient)} />
              )}
              
              <div className="relative z-10 text-center px-4">
                <span className="text-3xl drop-shadow-md">{event.emoji}</span>
                <h3 className="mt-1 text-base font-bold leading-tight text-white drop-shadow-md line-clamp-1">
                  {event.title}
                </h3>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="p-4 space-y-3 bg-[var(--l-surface)]">
              {/* Date */}
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-pink-500" />
                <span>{event.formattedDate}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-purple-400" />
                <span className="truncate">
                  {(event.location as any)?.display_name ?? "Lagos, Nigeria"}
                </span>
              </div>

              {/* Attendance Progress bar */}
              <div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${event.fillPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-bold text-[var(--l-text-muted)]">
                  {event.attendeesCount} RSVPed
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-[#f72585]">
                  {event.daysToGo > 0
                    ? `${event.daysToGo} days to go`
                    : "Happening now!"}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAttendToggle(event.id)}
                  disabled={attendMutation.isPending}
                  className={cn(
                    "h-7 rounded-full border-[var(--l-border)] px-3 text-xs font-bold transition-all",
                    event.isUserAttending
                      ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700"
                      : "text-[var(--l-text)] hover:border-[#f72585] hover:bg-pink-50 hover:text-[#f72585]"
                  )}
                >
                  {attendMutation.isPending && (
                    <span className="mr-1 h-3 w-3 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  )}
                  {event.isUserAttending ? (
                    <span className="flex items-center gap-0.5">
                      <Check className="h-3 w-3" /> Attending
                    </span>
                  ) : (
                    "I'm Interested"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
