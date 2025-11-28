"use client";

import React, { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GuestRow } from "./GuestRow";

type RouterOutput = inferRouterOutputs<AppRouter>;
type event = RouterOutput["event"]["getById"];
type Guest = NonNullable<event["guestLists"][0]>["guests"][number];

interface GuestListModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
  ATTENDING: "bg-green-100 text-green-800 hover:bg-green-100/80",
  MAYBE: "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
  DECLINED: "bg-red-100 text-red-800 hover:bg-red-100/80",
};

const AddGuestRow = ({
  eventId,
  guestListId,
  nextAvailableTable,
}: {
  eventId: string;
  guestListId: string;
  nextAvailableTable: number;
}) => {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tableNumber, setTableNumber] = useState<number | "">("");

  const addGuest = api.event.addGuest.useMutation({
    onMutate: async (newGuest) => {
      await utils.event.getById.cancel({ id: eventId });
      const previousEvent = utils.event.getById.getData({ id: eventId });
      if (previousEvent) {
        utils.event.getById.setData({ id: eventId }, (oldEvent) => {
          if (!oldEvent || !oldEvent.guestLists[0]) return oldEvent;
          return {
            ...oldEvent,
            guestLists: [
              {
                ...oldEvent.guestLists[0],
                guests: [
                  ...oldEvent.guestLists[0].guests,
                  {
                    id: `optimistic-${Date.now()}`,
                    status: "PENDING",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    name: newGuest.name,
                    email: newGuest.email ?? null,
                    tableNumber: newGuest.tableNumber ?? null,
                    listId: newGuest.guestListId,
                    invitationToken: null, // Add this line
                  },
                ],
              },
            ],
          };
        });
      }
      toast.success("Guest added!");
      setName("");
      setEmail("");
      setTableNumber("");
      return { previousEvent };
    },
    onError: (err, newGuest, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: eventId }, context.previousEvent);
      }
      toast.error("Failed to add guest");
    },
    onSettled: () => {
      void utils.event.getById.invalidate({ id: eventId });
    },
  });

  const handleAddGuest = () => {
    if (!name) {
      toast.error("Guest name is required");
      return;
    }
    addGuest.mutate({
      guestListId,
      name,
      email,
      tableNumber: tableNumber === "" ? undefined : Number(tableNumber),
    });
  };

  return (
    <TableRow>
      <TableCell>
        <Input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder={`e.g. ${nextAvailableTable}`}
          type="number"
          value={tableNumber}
          onChange={(e) =>
            setTableNumber(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      </TableCell>
      <TableCell>
        <Badge className={statusColors.PENDING}>PENDING</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          onClick={handleAddGuest}
          size="sm"
          disabled={addGuest.isPending}
        >
          {addGuest.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add
        </Button>
      </TableCell>
    </TableRow>
  );
};

export const GuestListModal = ({
  event,
  isOpen,
  onClose,
}: GuestListModalProps) => {
  const guestList = event.guestLists[0]; // Assuming one guest list for now

  const guests = useMemo(() => guestList?.guests ?? [], [guestList?.guests]);

  const nextAvailableTable = useMemo(() => {
    const tableNumbers = new Set(
      guests.map((g) => g.tableNumber).filter((t) => t !== null),
    );
    let nextTable = 1;
    while (tableNumbers.has(nextTable)) {
      nextTable++;
    }
    return nextTable;
  }, [guests]);

  if (!guestList) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-w-4xl sm:rounded-lg sm:border sm:p-6">
        <DialogHeader className="border-b p-6 pb-4 sm:border-b-0 sm:p-0 sm:pb-4">
          <DialogTitle>Guest List</DialogTitle>
          <DialogDescription>
            Manage your guests for {event.title}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24">Table #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <GuestRow key={guest.id} guest={guest} eventId={event.id} />
              ))}
              <AddGuestRow
                eventId={event.id}
                guestListId={guestList.id}
                nextAvailableTable={nextAvailableTable}
              />
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
