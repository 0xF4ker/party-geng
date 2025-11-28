"use client";

import React, { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { api } from "@/trpc/react";
import { EventChatModal } from "./EventChatModal";

export const EventChatButton = () => {
  const pathname = usePathname();
  const params = useParams<{ eventId?: string }>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isEventBoardPage =
    pathname.startsWith("/event/") && pathname.endsWith("/board");
  const eventId = params.eventId;

  const { data: event } = api.event.getById.useQuery(
    { id: eventId! },
    { enabled: !!eventId && isEventBoardPage },
  );

  if (!isEventBoardPage || !event?.conversation) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed right-6 bottom-6 z-50 h-16 w-16 rounded-full shadow-lg"
      >
        {isChatOpen ? <X /> : <MessageCircle className="h-8 w-8" />}
      </Button>

      {isChatOpen && (
        <EventChatModal
          conversationId={event.conversation.id}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  );
};
