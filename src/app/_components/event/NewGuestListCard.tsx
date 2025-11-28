"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventGuestList = RouterOutput["event"]["getById"]["guestLists"];

interface NewGuestListCardProps {
  guestLists: EventGuestList;
  _eventId: string;
  onManage: () => void;
}

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="text-center">
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export const NewGuestListCard = ({ guestLists, _eventId, onManage }: NewGuestListCardProps) => {
  const allGuests = guestLists.flatMap((list) => list.guests);
  const invited = allGuests.length;
  const attending = allGuests.filter((g) => g.status === 'ATTENDING').length;
  const maybe = allGuests.filter((g) => g.status === 'MAYBE').length;
  const declined = allGuests.filter((g) => g.status === 'DECLINED').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat label="Invited" value={invited} color="text-blue-500" />
          <Stat label="Attending" value={attending} color="text-green-500" />
          <Stat label="Maybe" value={maybe} color="text-yellow-500" />
          <Stat label="Declined" value={declined} color="text-red-500" />
        </div>
        <Button onClick={onManage} className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200">
          <Users className="mr-2 h-4 w-4" />
          Manage Guests
        </Button>
      </CardContent>
    </Card>
  );
};