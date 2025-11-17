import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calendar, Layers } from "lucide-react";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth"; // Adjust path to your auth hook

interface QuoteModalProps {
  conversationId: string;
  clientId: string; // The ID of the user receiving the quote
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  title: string;
  price: string; // String for input handling, converted on submit
  eventDate: string;
  includes: string;
}

export const CreateQuoteModal = ({
  conversationId,
  clientId,
  onClose,
  onSuccess,
}: QuoteModalProps) => {
  const { user } = useAuth();

  // Form State
  const [form, setForm] = useState<FormState>({
    title: "",
    price: "",
    eventDate: "",
    includes: "",
  });
  const [selectedServiceId, setSelectedServiceId] = useState<number | "">("");

  // 1. Fetch Vendor Services to populate dropdown
  const { data: vendorProfile, isLoading: isLoadingServices } =
    api.vendor.getMyProfile.useQuery(undefined, {
      enabled: user?.role === "VENDOR",
      staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

  const services = vendorProfile?.services ?? [];

  // 2. Mutation
  const createQuote = api.quote.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  // Auto-fill title when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const s = services.find(
        (vs) => vs.service.id === Number(selectedServiceId),
      );
      if (s) {
        setForm((prev) => ({ ...prev, title: s.service.name }));
      }
    }
  }, [selectedServiceId, services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    // Convert includes string (newlines) to array
    const includesArray = form.includes
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    createQuote.mutate({
      serviceIds: [Number(selectedServiceId)],
      clientId,
      conversationId,
      title: form.title,
      price: parseFloat(form.price),
      eventDate: new Date(form.eventDate),
      includes: includesArray,
    });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-200">
      <div className="animate-in zoom-in-95 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">
            Create Custom Quote
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Service Selection */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Layers className="h-4 w-4 text-pink-500" /> Select Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(Number(e.target.value))}
              disabled={isLoadingServices}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none disabled:bg-gray-100"
              required
            >
              <option value="">-- Choose a service --</option>
              {services.map((vs) => (
                <option key={vs.service.id} value={vs.service.id}>
                  {vs.service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Price */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="h-4 w-4 text-green-600" /> Price (₦)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                placeholder="0.00"
                required
                min="0"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 text-blue-500" /> Event Date
              </label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) =>
                  setForm({ ...form, eventDate: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Includes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              What&apos;s Included?{" "}
              <span className="font-normal text-gray-400">
                (One item per line)
              </span>
            </label>
            <textarea
              rows={4}
              value={form.includes}
              onChange={(e) => setForm({ ...form, includes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
              placeholder="- 4 Hours of service&#10;- Travel costs included&#10;- Premium equipment"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createQuote.isPending || !selectedServiceId}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {createQuote.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send Quote"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
