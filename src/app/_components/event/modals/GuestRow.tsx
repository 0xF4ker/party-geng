"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Trash2, Edit, Mail, Check, X } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { GuestStatus } from "@prisma/client";

type RouterOutput = inferRouterOutputs<AppRouter>;
type event = RouterOutput["event"]["getById"];
type Guest = NonNullable<event["guestLists"][0]>["guests"][number];

const statusColors: { [key: string]: string } = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
    ATTENDING: "bg-green-100 text-green-800 hover:bg-green-100/80",
    MAYBE: "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
    DECLINED: "bg-red-100 text-red-800 hover:bg-red-100/80",
};

export const GuestRow = ({ guest, eventId }: { guest: Guest; eventId: string }) => {
    const utils = api.useUtils();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(guest.name);
    const [email, setEmail] = useState(guest.email ?? "");
    const [tableNumber, setTableNumber] = useState<number | "">(guest.tableNumber ?? "");

    const updateGuest = api.event.updateGuest.useMutation({
        onMutate: async (updatedGuest) => {
            await utils.event.getById.cancel({ id: eventId });
            const previousEvent = utils.event.getById.getData({ id: eventId });
            if (previousEvent) {
                utils.event.getById.setData({ id: eventId }, (oldEvent) => {
                    if (!oldEvent || !oldEvent.guestLists[0]) return oldEvent;
                    return {
                        ...oldEvent,
                        guestLists: [{
                            ...oldEvent.guestLists[0],
                            guests: oldEvent.guestLists[0].guests.map(g => g.id === updatedGuest.guestId ? {...g, ...updatedGuest} : g)
                        }]
                    }
                });
            }
            setIsEditing(false);
            return { previousEvent };
        },
        onError: (err, updatedGuest, context) => {
            if (context?.previousEvent) {
                utils.event.getById.setData({ id: eventId }, context.previousEvent);
            }
            toast.error("Failed to update guest");
        },
        onSettled: () => {
            void utils.event.getById.invalidate({ id: eventId });
        }
    });

    const deleteGuest = api.event.deleteGuest.useMutation({
        onMutate: async ({ guestId }) => {
            await utils.event.getById.cancel({ id: eventId });
            const previousEvent = utils.event.getById.getData({ id: eventId });
            if (previousEvent) {
                utils.event.getById.setData({ id: eventId }, (oldEvent) => {
                    if (!oldEvent || !oldEvent.guestLists[0]) return oldEvent;
                    return {
                        ...oldEvent,
                        guestLists: [{
                            ...oldEvent.guestLists[0],
                            guests: oldEvent.guestLists[0].guests.filter(g => g.id !== guestId)
                        }]
                    }
                });
            }
            return { previousEvent };
        },
        onError: (err, guestId, context) => {
            if (context?.previousEvent) {
                utils.event.getById.setData({ id: eventId }, context.previousEvent);
            }
            toast.error("Failed to delete guest");
        },
        onSettled: () => {
            void utils.event.getById.invalidate({ id: eventId });
        }
    });

    const sendInvitation = api.event.sendGuestInvitation.useMutation({
        onSuccess: () => {
            toast.success("Invitation sent!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleUpdate = () => {
        updateGuest.mutate({
            guestId: guest.id,
            name: name,
            email: email,
            tableNumber: tableNumber === "" ? undefined : Number(tableNumber),
        });
    }

    const handleSendInvitation = () => {
        if (!guest.email) {
            toast.error("Guest email is required to send an invitation.");
            return;
        }
        sendInvitation.mutate({ guestId: guest.id });
    }

    if (isEditing) {
        return (
            <TableRow>
                <TableCell>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </TableCell>
                <TableCell>
                    <Input value={email} onChange={e => setEmail(e.target.value)} />
                </TableCell>
                <TableCell>
                    <Input value={tableNumber} type="number" onChange={e => setTableNumber(e.target.value === "" ? "" : Number(e.target.value))} />
                </TableCell>
                <TableCell>
                    <Badge className={statusColors[guest.status] ?? "bg-gray-100 text-gray-800"}>
                      {guest.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={handleUpdate}>
                            {updateGuest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <TableRow key={guest.id}>
          <TableCell className="font-medium">{guest.name}</TableCell>
          <TableCell>{guest.email}</TableCell>
          <TableCell>{guest.tableNumber ?? "N/A"}</TableCell>
          <TableCell>
            <Badge className={statusColors[guest.status] ?? "bg-gray-100 text-gray-800"}>
              {guest.status}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSendInvitation} disabled={sendInvitation.isPending}>
                {sendInvitation.isPending && sendInvitation.variables?.guestId === guest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteGuest.mutate({ guestId: guest.id })}>
                {deleteGuest.isPending && deleteGuest.variables?.guestId === guest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </TableCell>
        </TableRow>
    )

}
