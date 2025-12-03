"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Todo = RouterOutput["personalTodo"]["getByEventId"][number];

interface PersonalTodoListCardProps {
  eventId: string;
}

export const PersonalTodoListCard = ({ eventId }: PersonalTodoListCardProps) => {
  const utils = api.useUtils();
  const { data: todos, isLoading } = api.personalTodo.getByEventId.useQuery({ eventId });

  const [newItemContent, setNewItemContent] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState<Date | undefined>(undefined);

  const createTodo = api.personalTodo.create.useMutation({
    onMutate: async (newItem) => {
      await utils.personalTodo.getByEventId.cancel({ eventId });
      const previousTodos = utils.personalTodo.getByEventId.getData({ eventId });
      const optimisticTodo: Todo = {
        id: `optimistic-${Date.now()}`,
        content: newItem.content,
        dueDate: newItem.dueDate ?? null,
        isCompleted: false,
        eventId: eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      utils.personalTodo.getByEventId.setData({ eventId }, (old) => [...(old ?? []), optimisticTodo]);
      setNewItemContent("");
      setNewItemDueDate(undefined);
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      utils.personalTodo.getByEventId.setData({ eventId }, context?.previousTodos);
      toast.error("Failed to add to-do: " + err.message);
    },
    onSettled: () => {
      void utils.personalTodo.getByEventId.invalidate({ eventId });
    },
  });

  const updateTodo = api.personalTodo.update.useMutation({
    onMutate: async (updatedTodo) => {
        await utils.personalTodo.getByEventId.cancel({ eventId });
        const previousTodos = utils.personalTodo.getByEventId.getData({ eventId });
        utils.personalTodo.getByEventId.setData({ eventId }, (old) =>
            old?.map(todo => todo.id === updatedTodo.id ? {...todo, ...updatedTodo} : todo)
        );
        return { previousTodos };
    },
    onError: (err, newTodo, context) => {
        utils.personalTodo.getByEventId.setData({ eventId }, context?.previousTodos);
        toast.error("Failed to update to-do: " + err.message);
    },
    onSettled: () => {
        void utils.personalTodo.getByEventId.invalidate({ eventId });
    },
  });

  const deleteTodo = api.personalTodo.delete.useMutation({
    onMutate: async (deletedTodo) => {
        await utils.personalTodo.getByEventId.cancel({ eventId });
        const previousTodos = utils.personalTodo.getByEventId.getData({ eventId });
        utils.personalTodo.getByEventId.setData({ eventId }, (old) =>
            old?.filter(todo => todo.id !== deletedTodo.id)
        );
        return { previousTodos };
    },
    onError: (err, newTodo, context) => {
        utils.personalTodo.getByEventId.setData({ eventId }, context?.previousTodos);
        toast.error("Failed to delete to-do: " + err.message);
    },
    onSettled: () => {
        void utils.personalTodo.getByEventId.invalidate({ eventId });
    },
  });

  const handleAddItem = () => {
    if (newItemContent.trim()) {
      createTodo.mutate({
        eventId,
        content: newItemContent.trim(),
        dueDate: newItemDueDate,
      });
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">To-Do List</h3>
        <Button onClick={handleAddItem} disabled={createTodo.isPending} size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
          {createTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Add Entry</span>
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New to-do item..."
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Input
            type="date"
            value={newItemDueDate ? format(newItemDueDate, "yyyy-MM-dd") : ""}
            onChange={(e) => setNewItemDueDate(e.target.value ? new Date(e.target.value) : undefined)}
            className="w-auto"
          />
        </div>

        {isLoading && <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-gray-400" />}

        <div className="max-h-60 overflow-y-auto pr-2">
            {todos?.map((todo) => (
            <div
                key={todo.id}
                className={cn(
                "flex items-center justify-between rounded-lg p-3 transition-colors",
                todo.isCompleted && "opacity-60",
                todo.id.startsWith('optimistic') && 'opacity-50'
                )}
            >
                <div className="flex items-center">
                <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.isCompleted}
                    onCheckedChange={(checked) => {
                    updateTodo.mutate({ id: todo.id, isCompleted: !!checked });
                    }}
                    disabled={todo.id.startsWith('optimistic')}
                />
                <div className="ml-3">
                    <label
                    htmlFor={`todo-${todo.id}`}
                    className={cn(
                        "font-medium",
                        todo.isCompleted && "text-gray-400 line-through",
                    )}
                    >
                    {todo.content}
                    </label>
                    {todo.dueDate && (
                    <p className={cn("text-xs", todo.isCompleted ? "text-gray-400" : "text-gray-500")}>
                        Due: {format(new Date(todo.dueDate), "MMM d, yyyy")}
                    </p>
                    )}
                </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo.mutate({ id: todo.id })}
                    disabled={deleteTodo.isPending && deleteTodo.variables?.id === todo.id}
                    className="h-8 w-8"
                >
                    {(deleteTodo.isPending && deleteTodo.variables?.id === todo.id) || todo.id.startsWith('optimistic') ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                </Button>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};
