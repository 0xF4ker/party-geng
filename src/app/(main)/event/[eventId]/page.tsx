"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Loader2,
  Users,
  DollarSign,
  Gift,
  Briefcase,
  Ticket,
  Lock,
  Plus,
  Search,
  Trash2,
  Mail,
  Edit,
  CheckCircle,
  Armchair,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { EventHeader } from "@/app/_components/event/EventHeader";
import { EditEventModal } from "@/app/_components/event/modals/EditEventModal";
import { AddVendorModal } from "@/app/_components/event/modals/AddVendorModal";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useUserType } from "@/hooks/useUserType";
import { PlanningProgressCenter } from "@/app/_components/event/PlanningProgressCenter";
import { PersonalTodoListCard } from "@/app/_components/event/PersonalTodoListCard";
import { BookedVendorsCard } from "@/app/_components/event/BookedVendorsCard";
import { WishlistCard } from "@/app/_components/event/WishlistCard";
import { NewBudgetManagerCard } from "@/app/_components/event/NewBudgetManagerCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { isVendor, loading: userTypeLoading } = useUserType();

  const [activeTab, setActiveTab] = useState<"overview" | "guests" | "ticketing">("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  // Guest manager search/inputs
  const [guestSearch, setGuestSearch] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestWhatsApp, setNewGuestWhatsApp] = useState("");
  const [newGuestTable, setNewGuestTable] = useState<number | "">("");
  const [addingGuest, setAddingGuest] = useState(false);

  const utils = api.useUtils();
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({
    id: eventId,
  });

  useEffect(() => {
    if (!userTypeLoading && isVendor) {
      router.replace(`/event/${eventId}/board`);
    }
  }, [userTypeLoading, isVendor, router, eventId]);

  // Mutations
  const addGuestMutation = api.event.addGuest.useMutation({
    onSuccess: () => {
      toast.success("Guest added successfully!");
      setNewGuestName("");
      setNewGuestEmail("");
      setNewGuestWhatsApp("");
      setNewGuestTable("");
      void utils.event.getById.invalidate({ id: eventId });
      setAddingGuest(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add guest");
      setAddingGuest(false);
    },
  });

  const sendInvitationMutation = api.event.sendGuestInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation email dispatched to guest!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invitation");
    },
  });

  const deleteGuestMutation = api.event.deleteGuest.useMutation({
    onSuccess: () => {
      toast.success("Guest removed from invitation list");
      void utils.event.getById.invalidate({ id: eventId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove guest");
    },
  });

  // Derived properties
  const isPast = event ? new Date(event.endDate) < new Date() : false;
  const guestList = event?.guestLists[0];
  const allGuests = useMemo(() => guestList?.guests ?? [], [guestList?.guests]);

  const filteredGuests = useMemo(() => {
    return allGuests.filter(
      (g) =>
        g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
        (g.email && g.email.toLowerCase().includes(guestSearch.toLowerCase()))
    );
  }, [allGuests, guestSearch]);

  const tableGroups = useMemo(() => {
    const groups: Record<number, typeof allGuests> = {};
    allGuests.forEach((g) => {
      if (g.tableNumber !== null) {
        if (!groups[g.tableNumber]) groups[g.tableNumber] = [];
        groups[g.tableNumber]!.push(g);
      }
    });
    return groups;
  }, [allGuests]);

  const ticketingMetrics = useMemo(() => {
    if (!event?.isTicketed) return null;
    const paidGuests = allGuests.filter((g) => g.hasPaid);
    const ticketsSold = paidGuests.length;
    const totalRevenue = ticketsSold * event.ticketPrice;
    return {
      ticketsSold,
      totalRevenue,
    };
  }, [event, allGuests]);

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestList) return;
    if (!newGuestName.trim()) {
      toast.error("Guest name is required");
      return;
    }
    setAddingGuest(true);
    addGuestMutation.mutate({
      guestListId: guestList.id,
      name: newGuestName,
      email: newGuestEmail.trim() || undefined,
      whatsAppNumber: newGuestWhatsApp.trim() || undefined,
      tableNumber: newGuestTable === "" ? undefined : Number(newGuestTable),
    });
  };

  const handleSendInvite = (guestId: string, email: string | null, whatsApp: string | null) => {
    if (!email && !whatsApp) {
      toast.error("Guest must have an email address or WhatsApp number to send invitation.");
      return;
    }
    sendInvitationMutation.mutate({ guestId });
  };

  const handleDeleteGuest = (guestId: string) => {
    if (confirm("Are you sure you want to remove this guest?")) {
      deleteGuestMutation.mutate({ guestId });
    }
  };

  if (isEventLoading || userTypeLoading || isVendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <p className="text-xl">Event not found.</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "My Events", href: "/manage_events" },
    { label: event.title, href: `/event/${event.id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 text-gray-900 sm:pt-28 md:pt-32">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />
        <EventHeader event={event} onEdit={() => setIsEditModalOpen(true)} />

        <div className="mt-8">
          <PlanningProgressCenter
            event={event as any}
            onScrollToSection={(section) => {
              if (section === "guests") setActiveTab("guests");
            }}
          />
        </div>

        {/* Tab Selection */}
        <div className="mt-8 flex border-b border-gray-200 gap-1.5 pb-2 overflow-x-auto">
          {[
            { id: "overview", name: "Overview & Tasks", icon: Briefcase },
            { id: "guests", name: "Guest List & Seating", icon: Users },
            { id: "ticketing", name: "Ticketing & Sales", icon: Ticket },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-pink-50 text-pink-600 shadow-sm border border-pink-100"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-8 lg:col-span-2">
                <PersonalTodoListCard eventId={event.id} isPast={isPast} />
                <NewBudgetManagerCard
                  budget={event.budget}
                  _eventId={event.id}
                  onManage={() => {}}
                  isPast={isPast}
                />
              </div>
              <div className="flex flex-col gap-8 lg:col-span-1">
                <BookedVendorsCard
                  vendors={event.hiredVendors}
                  _eventId={event.id}
                  onAdd={() => setIsAddVendorModalOpen(true)}
                  isPast={isPast}
                />
                <WishlistCard
                  wishlist={event.wishlist}
                  _eventId={event.id}
                  eventName={event.title}
                  onManage={() => {}}
                  isPast={isPast}
                />
              </div>
            </div>
          )}

          {activeTab === "guests" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Guest Directory List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Guest Directory</h3>
                      <p className="text-xs text-gray-500">
                        {allGuests.length} total guests invited to the event.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <Input
                        placeholder="Search guests..."
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        className="pl-9 rounded-xl text-sm border-gray-200 focus:border-pink-500"
                      />
                    </div>
                  </div>

                  {filteredGuests.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <th className="pb-3 pr-4">Guest Name</th>
                            <th className="pb-3 pr-4">Email</th>
                            <th className="pb-3 pr-4">WhatsApp</th>
                            <th className="pb-3 pr-4">Table</th>
                            <th className="pb-3 pr-4">Status</th>
                            {!isPast && <th className="pb-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredGuests.map((guest) => (
                            <tr key={guest.id} className="hover:bg-gray-50/50 transition">
                              <td className="py-3.5 pr-4 font-semibold text-gray-900">{guest.name}</td>
                              <td className="py-3.5 pr-4 text-gray-500 text-xs">{guest.email || "—"}</td>
                              <td className="py-3.5 pr-4 text-gray-500 text-xs">{guest.whatsAppNumber || "—"}</td>
                              <td className="py-3.5 pr-4">
                                {guest.tableNumber !== null ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">
                                    <Armchair className="h-3 w-3" />
                                    Table {guest.tableNumber}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-3.5 pr-4">
                                <span
                                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    guest.status === "ATTENDING"
                                      ? "bg-green-50 text-green-700"
                                      : guest.status === "PENDING"
                                      ? "bg-blue-50 text-blue-700"
                                      : guest.status === "DECLINED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-yellow-50 text-yellow-700"
                                  }`}
                                >
                                  {guest.status}
                                </span>
                              </td>
                              {!isPast && (
                                <td className="py-3.5 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSendInvite(guest.id, guest.email, guest.whatsAppNumber)}
                                      className="rounded-lg p-1.5 text-gray-400 hover:bg-pink-50 hover:text-pink-600 transition"
                                      title="Send Invitation"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteGuest(guest.id)}
                                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                      title="Remove Guest"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No matching guests found.
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Add Guest Form & Seating tables */}
              <div className="lg:col-span-1 space-y-6">
                {!isPast && (
                  <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-md font-bold text-gray-900">Add New Guest</h3>
                    <form onSubmit={handleAddGuest} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Guest Name
                        </label>
                        <Input
                          placeholder="e.g. Jane Doe"
                          value={newGuestName}
                          onChange={(e) => setNewGuestName(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-pink-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Email Address (Optional)
                        </label>
                        <Input
                          placeholder="jane@example.com"
                          value={newGuestEmail}
                          onChange={(e) => setNewGuestEmail(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-pink-500"
                          type="email"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          WhatsApp Number (Optional)
                        </label>
                        <Input
                          placeholder="e.g. +2348012345678"
                          value={newGuestWhatsApp}
                          onChange={(e) => setNewGuestWhatsApp(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Table Assignment (Optional)
                        </label>
                        <Input
                          placeholder="e.g. 5"
                          value={newGuestTable}
                          onChange={(e) =>
                            setNewGuestTable(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="rounded-xl border-gray-200 focus:border-pink-500"
                          type="number"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={addingGuest}
                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                      >
                        {addingGuest ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Guestlist
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                )}

                {/* Table seating groupings */}
                <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Armchair className="h-5 w-5 text-slate-500" />
                    <h3 className="text-md font-bold text-gray-900">Seating Groupings</h3>
                  </div>

                  {Object.keys(tableGroups).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(tableGroups).map(([tableNum, guests]) => (
                        <div
                          key={tableNum}
                          className="rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span>Table #{tableNum}</span>
                            <span className="text-[10px] text-gray-400">
                              {guests.length} {guests.length === 1 ? "guest" : "guests"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {guests.map((g) => g.name).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      No tables assigned yet. Add seating numbers to guests to group them!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ticketing" && (
            <div className="space-y-6">
              {!event.isTicketed ? (
                /* Ticketing Disabled Empty state */
                <div className="rounded-2xl border border-gray-150 bg-white p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                  <Ticket className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900">Ticketing is Disabled</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    This event is set up as free admission. To configure tickets and receive guest
                    payouts directly to your wallet balance, enable ticketing in settings.
                  </p>
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl"
                  >
                    Edit Event Settings
                  </Button>
                </div>
              ) : (
                /* Ticketing Dashboard */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Ledger directory */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Ticketing RSVP Sales</h3>
                        <p className="text-xs text-gray-500">
                          List of all guests who purchased tickets.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                              <th className="pb-3 pr-4">Guest</th>
                              <th className="pb-3 pr-4">Payment Ref</th>
                              <th className="pb-3 pr-4">Paid Price</th>
                              <th className="pb-3 pr-4">RSVP Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {allGuests
                              .filter((g) => g.hasPaid)
                              .map((guest) => (
                                <tr key={guest.id}>
                                  <td className="py-3.5 pr-4 font-semibold text-gray-900">
                                    {guest.name}
                                    {guest.email && (
                                      <span className="block text-[10px] text-gray-400 font-normal">
                                        {guest.email}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 pr-4 text-xs font-mono text-gray-500">
                                    {guest.paymentReference || "—"}
                                  </td>
                                  <td className="py-3.5 pr-4 font-bold text-gray-900">
                                    ₦{event.ticketPrice.toLocaleString()}
                                  </td>
                                  <td className="py-3.5 pr-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                      <CheckCircle className="h-3 w-3" />
                                      Attending
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            {allGuests.filter((g) => g.hasPaid).length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                                  No tickets sold yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Financial KPI stats card */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-6">
                      <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-pink-600" />
                        Sales Revenue
                      </h3>

                      <div className="space-y-4">
                        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Price per Ticket</p>
                            <p className="text-xl font-black text-gray-950 mt-0.5">
                              ₦{event.ticketPrice.toLocaleString()}
                            </p>
                          </div>
                          <Ticket className="h-8 w-8 text-pink-600 opacity-20" />
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Tickets Sold</p>
                            <p className="text-xl font-black text-gray-950 mt-0.5">
                              {ticketingMetrics?.ticketsSold ?? 0}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600 opacity-20" />
                        </div>

                        <div className="rounded-xl bg-pink-50/50 p-4 border border-pink-100 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-pink-700 uppercase font-bold">Total Earnings</p>
                            <p className="text-2xl font-black text-pink-700 mt-0.5">
                              ₦{ticketingMetrics?.totalRevenue.toLocaleString() ?? 0}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-pink-700 opacity-30 animate-pulse" />
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 leading-relaxed">
                        ⚠️ **Notice**: Ticket sales funds are credited immediately to your platform wallet balance
                        upon guest payment checkout verification. You can withdraw available funds anytime from your
                        wallet dashboard.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditEventModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <AddVendorModal
        event={event}
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
      />
    </div>
  );
}
