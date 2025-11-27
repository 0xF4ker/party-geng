"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Todos = EventDetails["todos"];

interface TodoListCardProps {
  todos: Todos;
  eventId: string;
}

export const TodoListCard = ({ todos, eventId }: TodoListCardProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">To-Do List</h3>
        <Link href={`/event/${eventId}/board`} passHref>
          <Button variant="outline" size="sm">
            Full Board
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {todos
          .sort((a, b) => a.order - b.order)
          .map((list) => (
            <div key={list.id} className="rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-700">{list.title}</h4>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {list.items.length}
              </p>
              <p className="text-sm text-gray-500">tasks</p>
            </div>
          ))}
      </div>
    </div>
  );
};
