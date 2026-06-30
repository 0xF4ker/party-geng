"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Ticket, CheckCircle, X, Plus } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";

type routerOutput = inferRouterOutputs<AppRouter>;
type Event = routerOutput["event"]["getById"];

interface EditEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

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

export const EditEventModal = ({
  event,
  isOpen,
  onClose,
}: EditEventModalProps) => {
  const utils = api.useUtils();

  const [location, setLocation] = useState<LocationSearchResult | null>(
    (event.location as unknown as LocationSearchResult) ?? null,
  );
  const [startDate, setStartDate] = useState(
    new Date(event.startDate).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(event.endDate).toISOString().split("T")[0]
  );

  // Advanced settings from questionnaireData
  const [description, setDescription] = useState("");
  const [isTicketed, setIsTicketed] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [rsvpButtonTitle, setRsvpButtonTitle] = useState("Attend");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [ticketTiers, setTicketTiers] = useState<Array<{ id?: string; name: string; price: number; description?: string }>>([]);

  useEffect(() => {
    if (isOpen && event) {
      setStartDate(new Date(event.startDate).toISOString().split("T")[0]);
      setEndDate(new Date(event.endDate).toISOString().split("T")[0]);
      setLocation((event.location as unknown as LocationSearchResult) ?? null);

      const qData = (event.questionnaireData as any) ?? {};
      setDescription(qData.description || "");
      setIsTicketed(event.isTicketed || false);
      setTicketPrice(event.ticketPrice || 0);
      setRsvpButtonTitle(qData.rsvpButtonTitle || "Attend");
      setSelectedTheme(
        qData.selectedTheme || "linear-gradient(to right, #ec4899, #8b5cf6, #6366f1)"
      );
      setTicketTiers(
        (event as any).ticketTiers && (event as any).ticketTiers.length > 0
          ? (event as any).ticketTiers.map((t: any) => ({
              id: t.id,
              name: t.name,
              price: t.price,
              description: t.description || "",
            }))
          : [{ name: "General Admission", price: 5000, description: "" }]
      );
    }
  }, [isOpen, event]);

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Event details updated successfully!");
      void utils.event.getById.invalidate({ id: event.id });
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update event details");
    },
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (endDate && newStart > endDate) {
      setEndDate(newStart);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("eventName") as HTMLInputElement)?.value;
    
    if (!title || !startDate || !endDate) return;

    updateEvent.mutate({
      id: event.id,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      isTicketed,
      ticketPrice: isTicketed && ticketTiers.length > 0 ? ticketTiers[0]!.price : 0,
      ticketTiers: isTicketed ? ticketTiers : [],
      questionnaireData: {
        ...((event.questionnaireData as any) ?? {}),
        description,
        rsvpButtonTitle,
        selectedTheme,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-gray-100">
          <DialogTitle>Edit Event Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="eventName"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Event Title
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              defaultValue={event.title}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="eventLocation"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Location (Optional)
            </label>
            <LocationSearchInput
              initialValue={location?.display_name}
              onLocationSelect={setLocation}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell guests details about this celebration..."
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-pink-500 focus:outline-none min-h-[80px] resize-none"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-2" />

          {/* Ticketing Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-xl p-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800">Enable Ticketing RSVP</h4>
                <p className="text-[11px] text-gray-500">Sell entries to this celebration.</p>
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
              <div className="border border-gray-150 bg-gray-50/30 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
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

            <div className="flex items-center justify-between border border-gray-150 bg-gray-50/30 rounded-xl p-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800">RSVP Button Label</h4>
                <p className="text-[11px] text-gray-500">Action text for guest invitations.</p>
              </div>
              <select
                value={rsvpButtonTitle}
                onChange={(e) => setRsvpButtonTitle(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 p-2.5 outline-none cursor-pointer"
              >
                {["Attend", "Register", "Join", "Buy Ticket", "RSVP"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme Color Picker */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Update Theme Gradient
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((grad, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTheme(grad.value)}
                  style={{ background: grad.value }}
                  className={`h-12 rounded-xl cursor-pointer border-2 transition-all relative ${
                    selectedTheme === grad.value
                      ? "border-slate-800 scale-[0.96] shadow-[0_0_10px_rgba(0,0,0,0.15)]"
                      : "border-transparent hover:scale-102"
                  }`}
                >
                  {selectedTheme === grad.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-white/30 backdrop-blur-md p-0.5">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end border-t border-gray-100 pt-4 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEvent.isPending}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold px-5"
            >
              {updateEvent.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
