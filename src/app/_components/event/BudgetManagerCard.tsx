"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { WalletIcon } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Budget = EventDetails["budget"];

interface BudgetManagerCardProps {
  budget: Budget;
  _eventId: string;
  onManage: () => void;
}

export const BudgetManagerCard = ({
  budget,
  _eventId,
  onManage,
}: BudgetManagerCardProps) => {
  const totalEstimated =
    budget?.items.reduce((acc, item) => acc + item.estimatedCost, 0) ?? 0;
  const totalActual =
    budget?.items.reduce((acc, item) => acc + (item.actualCost ?? 0), 0) ?? 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Budget Manager</h3>
            <Button variant="outline" size="sm" onClick={onManage}>
                <WalletIcon className="mr-2 h-4 w-4" />
                Manage
            </Button>
        </div>

      <div className="mt-4 space-y-2">
        {budget?.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <p className="text-gray-600">{item.description}</p>
            <p className="text-gray-800 font-mono">
              ₦{item.actualCost?.toLocaleString() ?? "0"} / ₦{item.estimatedCost.toLocaleString()}
            </p>
          </div>
        ))}
        <hr />
        <div className="flex justify-between font-bold">
            <p>Grand Total</p>
            <p className="font-mono">
                ₦{totalActual.toLocaleString()} / ₦{totalEstimated.toLocaleString()}
            </p>
        </div>
      </div>
    </div>
  );
};
