"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
type RouterOutput = inferRouterOutputs<AppRouter>;
type Todo = RouterOutput["personalTodo"]["getByEventId"][number];
interface PersonalTodoListCardProps {
  eventId: string;
  isPast?: boolean;
}
export const PersonalTodoListCard = ({
  eventId,
  isPast = false,
}: PersonalTodoListCardProps) => {
  const utils = api.useUtils();
  const { data: todos, isLoading } = api.personalTodo.getByEventId.useQuery({
    eventId,
  });
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState<Date | undefined>(
    undefined,
  );
  const createTodo = api.personalTodo.create.useMutation({
    onMutate: async (newItem) => {
      await utils.personalTodo.getByEventId.cancel({ eventId });
      const previousTodos = utils.personalTodo.getByEventId.getData({
        eventId,
      });
      const optimisticTodo: Todo = {
        id: `optimistic-${Date.now()}`,
        content: newItem.content,
        dueDate: newItem.dueDate ?? null,
        isCompleted: false,
        eventId: eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      utils.personalTodo.getByEventId.setData({ eventId }, (old) => [
        ...(old ?? []),
        optimisticTodo,
      ]);
      setNewItemContent("");
      setNewItemDueDate(undefined);
      return { previousTodos };
    },
    onSuccess: () => {
      toast.success("To-do task added!");
    },
    onError: (err, newTodo, context) => {
      utils.personalTodo.getByEventId.setData(
        { eventId },
        context?.previousTodos,
      );
      toast.error("Failed to add to-do: " + err.message);
    },
    onSettled: () => {
      void utils.personalTodo.getByEventId.invalidate({ eventId });
    },
  });
  const updateTodo = api.personalTodo.update.useMutation({
    onMutate: async (updatedTodo) => {
      await utils.personalTodo.getByEventId.cancel({ eventId });
      const previousTodos = utils.personalTodo.getByEventId.getData({
        eventId,
      });
      utils.personalTodo.getByEventId.setData({ eventId }, (old) =>
        old?.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo,
        ),
      );
      return { previousTodos };
    },
    onSuccess: () => {
      toast.success("Task updated!");
    },
    onError: (err, newTodo, context) => {
      utils.personalTodo.getByEventId.setData(
        { eventId },
        context?.previousTodos,
      );
      toast.error("Failed to update to-do: " + err.message);
    },
    onSettled: () => {
      void utils.personalTodo.getByEventId.invalidate({ eventId });
    },
  });
  const deleteTodo = api.personalTodo.delete.useMutation({
    onMutate: async (deletedTodo) => {
      await utils.personalTodo.getByEventId.cancel({ eventId });
      const previousTodos = utils.personalTodo.getByEventId.getData({
        eventId,
      });
      utils.personalTodo.getByEventId.setData({ eventId }, (old) =>
        old?.filter((todo) => todo.id !== deletedTodo.id),
      );
      return { previousTodos };
    },
    onSuccess: () => {
      toast.success("Task deleted.");
    },
    onError: (err, newTodo, context) => {
      utils.personalTodo.getByEventId.setData(
        { eventId },
        context?.previousTodos,
      );
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            Event Tasks Checklist
            {isPast && <Lock className="h-4 w-4 text-gray-400" />}
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">Keep track of preparation and vendor schedules</p>
        </div>
        {!isPast && (
          <Button
            onClick={handleAddItem}
            disabled={createTodo.isPending}
            size="sm"
            className="h-8 rounded-xl bg-pink-600 text-white hover:bg-pink-700 text-xs font-bold transition shadow-sm shadow-pink-100"
          >
            {createTodo.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Add Task
          </Button>
        )}
      </div>
      {!isPast && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              className="flex-1 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={newItemDueDate ? format(newItemDueDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setNewItemDueDate(
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
                className="w-full sm:w-auto rounded-xl text-gray-600"
              />
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
        </div>
      )}
      <div className="mt-4 max-h-[340px] overflow-y-auto pr-1">
        {todos?.map((todo) => {
          const isOverdue =
            todo.dueDate &&
            !todo.isCompleted &&
            new Date(todo.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

          return (
            <div
              key={todo.id}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3.5 mb-2.5 transition-all duration-200 hover:translate-x-0.5",
                todo.isCompleted
                  ? "border-emerald-100 bg-emerald-50/20 opacity-70"
                  : isOverdue
                  ? "border-rose-100 bg-rose-50/20 hover:border-rose-200"
                  : "border-gray-100 bg-gray-50/20 hover:border-gray-200 hover:bg-gray-50/50",
                todo.id.startsWith("optimistic") && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.isCompleted}
                  onCheckedChange={(checked) => {
                    if (!isPast) {
                      updateTodo.mutate({ id: todo.id, isCompleted: !!checked });
                    }
                  }}
                  disabled={todo.id.startsWith("optimistic") || isPast}
                  className="mt-0.5"
                />
                <div>
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={cn(
                      "font-semibold text-sm text-gray-800",
                      todo.isCompleted && "text-gray-400 line-through"
                    )}
                  >
                    {todo.content}
                  </label>
                  {todo.dueDate && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          todo.isCompleted ? "text-gray-400" : isOverdue ? "text-rose-600" : "text-gray-500"
                        )}
                      >
                        Due: {format(new Date(todo.dueDate), "MMM d, yyyy")}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 uppercase tracking-wider">
                          <AlertCircle className="h-2 w-2" /> Overdue
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!isPast && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo.mutate({ id: todo.id })}
                  disabled={
                    deleteTodo.isPending && deleteTodo.variables?.id === todo.id
                  }
                  className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  {(deleteTodo.isPending &&
                    deleteTodo.variables?.id === todo.id) ||
                  todo.id.startsWith("optimistic") ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          );
        })}
        {todos?.length === 0 && !isLoading && (
          <div className="py-8 text-center text-gray-400">
            <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-40 text-pink-400" />
            <p className="text-xs">No tasks on your checklist yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
