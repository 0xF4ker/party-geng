"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

import { EventHeader } from "@/app/_components/event/EventHeader";
import { WishlistCard } from "@/app/_components/event/WishlistCard";
import { NewBudgetManagerCard } from "@/app/_components/event/NewBudgetManagerCard";
import { GuestListCard } from "@/app/_components/event/GuestListCard";
import { BookedVendorsCard } from "@/app/_components/event/BookedVendorsCard";
import { TodoListCard } from "@/app/_components/event/TodoListCard";
import { EditEventModal } from "@/app/_components/event/modals/EditEventModal";
import { WishlistModal } from "@/app/_components/event/modals/WishlistModal";
import { BudgetManagerModal } from "@/app/_components/event/modals/BudgetManagerModal";
import { GuestListModal } from "@/app/_components/event/modals/GuestListModal";
import { AddVendorModal } from "@/app/_components/event/modals/AddVendorModal";
import Breadcrumb from "@/components/ui/breadcrumb";

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGuestListModalOpen, setIsGuestListModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
    {
      id: eventId,
    },
  );

  const { data: orders, isLoading: isOrdersLoading } =
    api.order.getMyOrders.useQuery(
      { status: "ACTIVE" },
      {
        enabled: !!event,
      },
    );

  const activeVendors =
    orders?.map((order) => ({
      id: order.vendor.id,
      name:
        order.vendor.vendorProfile?.companyName ??
        order.vendor.username ??
        "Vendor",
      service: order.quote.title ?? "Service",
      avatarUrl:
        order.vendor.vendorProfile?.avatarUrl ??
        "https://placehold.co/40x40/ec4899/ffffff?text=V",
      isAdded: false, // This will be set within the modal
    })) ?? [];

  if (isEventLoading || isOrdersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">Event not found.</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "My Events", href: "/manage_events" },
    { label: event.title, href: `/event/${event.id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 text-gray-900 sm:pt-28 md:pt-32">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />
        <EventHeader event={event} onEdit={() => setIsEditModalOpen(true)} />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <TodoListCard todos={event.todos} eventId={event.id} />
            <NewBudgetManagerCard
              budget={event.budget}
              _eventId={event.id}
              onManage={() => setIsBudgetModalOpen(true)}
            />
            {/* Other main content can go here */}
          </div>
          <div className="flex flex-col gap-8 lg:col-span-1">
            <BookedVendorsCard
              vendors={event.hiredVendors}
              _eventId={event.id}
              onAdd={() => setIsAddVendorModalOpen(true)}
            />
            <WishlistCard
              wishlist={event.wishlist}
              _eventId={event.id}
              onManage={() => setIsWishlistModalOpen(true)}
            />
            <GuestListCard
              guestLists={event.guestLists}
              _eventId={event.id}
              onManage={() => setIsGuestListModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <EditEventModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <WishlistModal
        event={event}
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
      />
      <BudgetManagerModal
        event={event}
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
      <GuestListModal
        event={event}
        isOpen={isGuestListModalOpen}
        onClose={() => setIsGuestListModalOpen(false)}
      />
      <AddVendorModal
        event={event}
        vendors={activeVendors}
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
      />
    </div>
  );
};

export default EventDetailPage;
