"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Trash2, X } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];

interface GuestListModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

export const GuestListModal = ({
  event,
  isOpen,
  onClose,
}: GuestListModalProps) => {
  const utils = api.useUtils();
  const [selectedListId, setSelectedListId] = useState<string | null>(
    event.guestLists[0]?.id ?? null,
  );

  const addGuest = api.event.addGuest.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });
  const updateGuest = api.event.updateGuest.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });
  const deleteGuest = api.event.deleteGuest.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });
  const addGuestList = api.event.addEmptyGuestList.useMutation({
      onSuccess: () => utils.event.getById.invalidate({id: event.id})
  });

  const handleAddGuest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedListId) return;
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    if (!name) return;

    addGuest.mutate({
      guestListId: selectedListId,
      name,
      email,
      status: "Invited",
    });
    form.reset();
  };

  const selectedList = event.guestLists.find(gl => gl.id === selectedListId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Guest List</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
            <div className="w-1/4">
                <h3 className="font-semibold mb-2">Lists</h3>
                {event.guestLists.map(gl => (
                    <Button key={gl.id} variant={selectedListId === gl.id ? "secondary" : "ghost"} onClick={() => setSelectedListId(gl.id)} className="w-full justify-start">
                        {gl.title}
                    </Button>
                ))}
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const title = (form.elements.namedItem("newListTitle") as HTMLInputElement)?.value;
                    if(!title) return;
                    addGuestList.mutate({eventId: event.id, title});
                    form.reset();
                }} className="flex gap-2 mt-2">
                    <Input name="newListTitle" placeholder="New List" />
                    <Button type="submit" size="sm" disabled={addGuestList.isPending}>Add</Button>
                </form>
            </div>
            <div className="w-3/4">
            {selectedList && (
                <>
                <h3 className="font-semibold mb-2">{selectedList.title}</h3>
                <div className="space-y-2">
                    {selectedList.guests.map(guest => (
                        <div key={guest.id} className="flex items-center gap-2">
                            <Input defaultValue={guest.name} onBlur={e => updateGuest.mutate({guestId: guest.id, name: e.target.value})} />
                            <Input defaultValue={guest.email ?? ""} onBlur={e => updateGuest.mutate({guestId: guest.id, email: e.target.value})} />
                            <Input defaultValue={guest.status} onBlur={e => updateGuest.mutate({guestId: guest.id, status: e.target.value})} />
                            <Button variant="ghost" size="icon" onClick={() => deleteGuest.mutate({guestId: guest.id})}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <form onSubmit={handleAddGuest} className="flex gap-2 mt-4">
                    <Input name="name" placeholder="Name" required />
                    <Input name="email" placeholder="Email" />
                    <Button type="submit" disabled={addGuest.isPending}>
                        {addGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Guest
                    </Button>
                </form>
                </>
            )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
