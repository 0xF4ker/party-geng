"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useUiStore } from "@/stores/ui";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  MapPin,
  Ticket,
  User,
  Mail,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function PublicEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { headerHeight } = useUiStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpCompleted, setRsvpCompleted] = useState(false);

  // Query details
  const { data: event, isLoading } = api.event.getPublicEventDetails.useQuery({
    id: eventId,
  });

  // Mutations
  const freeRsvpMutation = api.event.publicRsvp.useMutation({
    onSuccess: (data) => {
      toast.success(`RSVP confirmed! Welcome, ${data.guestName}.`);
      setRsvpCompleted(true);
      setSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit RSVP.");
      setSubmitting(false);
    },
  });

  const ticketPaymentMutation = api.payment.initializeTicketPayment.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to Paystack for ticket purchase...");
      window.location.href = data.authorization_url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initialize ticket checkout.");
      setSubmitting(false);
    },
  });

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);

    if (event?.isTicketed) {
      ticketPaymentMutation.mutate({
        eventId: event.id,
        email,
        name,
      });
    } else {
      freeRsvpMutation.mutate({
        eventId: eventId,
        name,
        email,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Event Not Found</h2>
          <p className="text-sm mt-1">This invitation link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const startDateFormatted = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const startTimeFormatted = new Date(event.startDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 pb-16"
      style={{ paddingTop: headerHeight }}
    >
      {/* Banner / Cover */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center">
        {event.coverImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.coverImage}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 text-center text-white px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white mb-3">
            <Sparkles className="h-3.5 w-3.5 text-pink-300" />
            Special Invitation
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Event details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900">Event Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="flex gap-3">
                  <div className="rounded-xl bg-pink-50 p-3 text-pink-600 shrink-0 h-11 w-11 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Date & Time</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{startDateFormatted}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{startTimeFormatted}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-3">
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600 shrink-0 h-11 w-11 flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Location</h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {(event.location as any)?.name || (event.location as any)?.address || "Lagos, Nigeria"}
                    </p>
                  </div>
                </div>

                {/* Host */}
                <div className="flex gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 shrink-0 h-11 w-11 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Hosted By</h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {event.client.name ?? `@${event.client.user.username}`}
                    </p>
                  </div>
                </div>

                {/* Admission */}
                <div className="flex gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 shrink-0 h-11 w-11 flex items-center justify-center">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">Admission Ticket</h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {event.isTicketed ? `₦${event.ticketPrice.toLocaleString()}` : "Free Admission"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: RSVP box */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-6">
              {rsvpCompleted ? (
                /* Success RSVP Screen */
                <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">Attendance Confirmed!</h3>
                    <p className="text-xs text-gray-500">
                      You have successfully RSVP&apos;d. We have sent the confirmation to your email.
                    </p>
                  </div>
                </div>
              ) : (
                /* Active RSVP Form */
                <form onSubmit={handleRsvpSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Confirm Your Attendance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Please enter your contact details to complete your RSVP.
                    </p>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : event.isTicketed ? (
                      <>
                        <Ticket className="h-4 w-4" />
                        Pay & Confirm (₦{event.ticketPrice.toLocaleString()})
                      </>
                    ) : (
                      "Confirm Free RSVP"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
