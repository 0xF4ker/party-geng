"use client";

import React from "react";
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

interface BudgetManagerModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetManagerModal = ({
  event,
  isOpen,
  onClose,
}: BudgetManagerModalProps) => {
  const utils = api.useUtils();
  const budget = event.budget;

  const addBudgetItem = api.event.addBudgetItem.useMutation({
    onMutate: async (newItem) => {
      await utils.event.getById.cancel({ id: event.id });
      const previousEvent = utils.event.getById.getData({ id: event.id });
      if (previousEvent && previousEvent.budget) {
        utils.event.getById.setData(
          { id: event.id },
          {
            ...previousEvent,
            budget: {
              ...previousEvent.budget,
              items: [
                ...previousEvent.budget.items,
                {
                  ...newItem,
                  id: "optimistic",
                  actualCost: null,
                  createdAt: new Date(),
                },
              ],
            },
          },
        );
      }
      return { previousEvent };
    },
    onError: (err, newItem, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: event.id }, context.previousEvent);
      }
    },
    onSettled: () => {
      void utils.event.getById.invalidate({ id: event.id });
    },
  });
  const updateBudgetItem = api.event.updateBudgetItem.useMutation({
    onMutate: async (updatedItem) => {
      await utils.event.getById.cancel({ id: event.id });
      const previousEvent = utils.event.getById.getData({ id: event.id });
      if (previousEvent && previousEvent.budget) {
        const newItems = previousEvent.budget.items.map((item) =>
          item.id === updatedItem.itemId ? { ...item, ...updatedItem } : item,
        );
        utils.event.getById.setData(
          { id: event.id },
          {
            ...previousEvent,
            budget: {
              ...previousEvent.budget,
              items: newItems,
            },
          },
        );
      }
      return { previousEvent };
    },
    onError: (err, newItem, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: event.id }, context.previousEvent);
      }
    },
    onSettled: () => {
      void utils.event.getById.invalidate({ id: event.id });
    },
  });
  const deleteBudgetItem = api.event.deleteBudgetItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!budget) return;
    const form = e.target as HTMLFormElement;
    const description = (
      form.elements.namedItem("description") as HTMLInputElement
    )?.value;
    const estimatedCost = (
      form.elements.namedItem("estimatedCost") as HTMLInputElement
    )?.value;

    if (!description || !estimatedCost) return;

    addBudgetItem.mutate({
      budgetId: budget.id,
      description,
      estimatedCost: Number(estimatedCost),
    });
    form.reset();
  };

  const totalEstimated =
    budget?.items.reduce((acc, item) => acc + item.estimatedCost, 0) ?? 0;
  const totalActual =
    budget?.items.reduce((acc, item) => acc + (item.actualCost ?? 0), 0) ?? 0;

  if (!budget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Budget Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between font-semibold">
            <p>Total Estimated:</p>
            <p>₦{totalEstimated.toLocaleString()}</p>
          </div>
          <div className="flex justify-between font-semibold">
            <p>Total Actual:</p>
            <p>₦{totalActual.toLocaleString()}</p>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <p>Remaining:</p>
            <p>₦{(totalEstimated - totalActual).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
            <p className="flex-grow">Description</p>
            <p className="w-32">Estimated</p>
            <p className="w-32">Actual</p>
            <div className="w-10"></div>
          </div>
          {budget.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                defaultValue={item.description}
                onBlur={(e) =>
                  updateBudgetItem.mutate({
                    itemId: item.id,
                    description: e.target.value,
                  })
                }
                className="flex-grow"
              />
              <Input
                type="number"
                defaultValue={item.estimatedCost}
                onBlur={(e) =>
                  updateBudgetItem.mutate({
                    itemId: item.id,
                    estimatedCost: Number(e.target.value),
                  })
                }
                className="w-32"
              />
              <Input
                type="number"
                defaultValue={item.actualCost ?? ""}
                placeholder="Actual"
                onBlur={(e) => {
                  const value = e.target.value;
                  updateBudgetItem.mutate({
                    itemId: item.id,
                    actualCost: value === "" ? undefined : Number(value),
                  });
                }}
                className="w-32"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteBudgetItem.mutate({ itemId: item.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input name="description" placeholder="Description" required />
          <Input
            name="estimatedCost"
            type="number"
            placeholder="Estimated Cost"
            required
          />
          <Button type="submit" disabled={addBudgetItem.isPending}>
            {addBudgetItem.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
