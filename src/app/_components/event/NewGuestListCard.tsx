"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventGuestList = RouterOutput["event"]["getById"]["guestLists"];

interface NewGuestListCardProps {
  guestLists: EventGuestList;
  _eventId: string;
  onManage: () => void;
  isPast?: boolean; // Added Prop
}

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="text-center">
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-muted-foreground text-sm">{label}</p>
  </div>
);

export const NewGuestListCard = ({
  guestLists,
  _eventId,
  onManage,
  isPast = false,
}: NewGuestListCardProps) => {
  const allGuests = guestLists.flatMap((list) => list.guests);
  const invited = allGuests.length;
  const attending = allGuests.filter((g) => g.status === "ATTENDING").length;
  const maybe = allGuests.filter((g) => g.status === "MAYBE").length;
  const declined = allGuests.filter((g) => g.status === "DECLINED").length;

  return (
    <Card className="relative">
      {/* {isPast && <div className="absolute inset-0 bg-white/50 z-10 pointer-events-none rounded-xl" />} */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Guest List
          {isPast && <Lock className="h-4 w-4 text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Invited" value={invited} color="text-blue-500" />
          <Stat label="Attending" value={attending} color="text-green-500" />
          <Stat label="Maybe" value={maybe} color="text-yellow-500" />
          <Stat label="Declined" value={declined} color="text-red-500" />
        </div>
        <Button
          onClick={onManage}
          className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
        >
          <Users className="mr-2 h-4 w-4" />
          {isPast ? "View Guest List" : "Manage Guests"}
        </Button>
      </CardContent>
    </Card>
  );
};
