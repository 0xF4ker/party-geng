"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

import { EventHeader } from "@/app/_components/event/EventHeader";
import { WishlistCard } from "@/app/_components/event/WishlistCard";
import { NewBudgetManagerCard } from "@/app/_components/event/NewBudgetManagerCard";
import { NewGuestListCard } from "@/app/_components/event/NewGuestListCard";
import { BookedVendorsCard } from "@/app/_components/event/BookedVendorsCard";
import { EditEventModal } from "@/app/_components/event/modals/EditEventModal"; // Assumed you will update this file next
import { WishlistModal } from "@/app/_components/event/modals/WishlistModal";
import { BudgetManagerModal } from "@/app/_components/event/modals/BudgetManagerModal";
import { GuestListModal } from "@/app/_components/event/modals/GuestListModal";
import { AddVendorModal } from "@/app/_components/event/modals/AddVendorModal";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useUserType } from "@/hooks/useUserType";
import { PersonalTodoListCard } from "@/app/_components/event/PersonalTodoListCard";

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { isVendor, loading: userTypeLoading } = useUserType();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGuestListModalOpen, setIsGuestListModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
    { id: eventId },
  );

  useEffect(() => {
    if (!userTypeLoading && isVendor) {
      router.replace(`/event/${eventId}/board`);
    }
  }, [userTypeLoading, isVendor, router, eventId]);

  if (isEventLoading || userTypeLoading || isVendor) {
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
  const isPast = event ? new Date(event.endDate) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 text-gray-900 sm:pt-28 md:pt-32">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Pass props (EventHeader handles isPast internally via logic, but children need prop) */}
        <EventHeader event={event} onEdit={() => setIsEditModalOpen(true)} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <PersonalTodoListCard eventId={event.id} isPast={isPast} />
            <NewGuestListCard
              guestLists={event.guestLists}
              _eventId={event.id}
              onManage={() => setIsGuestListModalOpen(true)}
              isPast={isPast}
            />
            <NewBudgetManagerCard
              budget={event.budget}
              _eventId={event.id}
              onManage={() => setIsBudgetModalOpen(true)}
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
              onManage={() => setIsWishlistModalOpen(true)}
              isPast={isPast}
            />
          </div>
        </div>
      </div>

      {/* Modals - If isPast is true, maybe prevent opening them or pass isPast to them too? 
          Since we hid the trigger buttons in the cards, these shouldn't open.
          But for safety/guest list view, we might open them in read-only mode.
      */}
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
        isPast={isPast} // Pass to modal for read-only view
      />
      <AddVendorModal
        event={event}
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
      />
    </div>
  );
};

export default EventDetailPage;
