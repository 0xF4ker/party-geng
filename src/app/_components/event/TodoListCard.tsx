"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Todos = EventDetails["todos"];

interface TodoListCardProps {
  todos: Todos;
  eventId: string;
}

const statusColors: { [key: string]: string } = {
    "To Do": "bg-red-100 text-red-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    "Done": "bg-green-100 text-green-800",
}

export const TodoListCard = ({ todos, eventId }: TodoListCardProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Moonboard</h3>
        <Link href={`/event/${eventId}/board`} passHref>
          <Button variant="outline" size="sm">
            Open Board
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {todos
          .sort((a, b) => a.order - b.order)
          .map((list) => (
            <div key={list.id} className={cn("rounded-lg p-4", statusColors[list.title] ?? 'bg-gray-50')}>
              <h4 className="font-semibold">{list.title}</h4>
              <p className="mt-2 text-2xl font-bold">
                {list.items.length}
              </p>
              <p className="text-sm">tasks</p>
            </div>
          ))}
      </div>
    </div>
  );
};
