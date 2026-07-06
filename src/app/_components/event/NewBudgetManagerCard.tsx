"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Lock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Budget = EventDetails["budget"];

interface NewBudgetManagerCardProps {
  budget: Budget;
  proposedBudget?: number;
  _eventId: string;
  onManage: () => void;
  isPast?: boolean;
}

const DEFAULT_COLORS = [
  "#4361ee", // Blue
  "#10b981", // Green
  "#e63946", // Red
  "#ffb703", // Yellow
  "#00b4d8", // Cyan
  "#7209b7", // Purple
  "#fb8500", // Orange
  "#2ec4b6", // Teal
];

const parseItemDescription = (rawDescription: string, index: number) => {
  if (!rawDescription) return { description: "", color: DEFAULT_COLORS[index % DEFAULT_COLORS.length]! };
  const parts = rawDescription.split("::");
  return {
    description: parts[0] || "",
    color: parts[1] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]!,
  };
};

export const NewBudgetManagerCard = ({
  budget,
  proposedBudget = 0,
  _eventId,
  onManage,
  isPast = false,
}: NewBudgetManagerCardProps) => {
  const budgetItems = budget?.items ?? [];
  const totalEstimated = budgetItems.reduce((acc, item) => acc + item.estimatedCost, 0);
  
  // Calculate percentage of proposed budget that has been allocated
  const allocationPercentage = proposedBudget > 0 ? (totalEstimated / proposedBudget) * 100 : 0;

  return (
    <div className="relative rounded-2xl bg-white border border-gray-100 p-6 text-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-lg text-gray-900">
            Budget Plan
            {isPast && <Lock className="h-4 w-4 text-gray-400" />}
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">Draft and allocate your projected expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Projected</span>
            <span className="font-bold text-base text-gray-800">
              ₦{proposedBudget.toLocaleString()}
            </span>
          </div>
          <Button
            onClick={onManage}
            variant="ghost"
            size="icon"
            disabled={isPast}
            className="h-8 w-8 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Allocation Progress Bar */}
      <div className="mb-6 space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-600">
          <span>Allocated: ₦{totalEstimated.toLocaleString()}</span>
          <span>{allocationPercentage.toFixed(0)}% of limit</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(100, allocationPercentage)}%` }}
          ></div>
        </div>
        {allocationPercentage > 100 && (
          <p className="text-[10px] font-bold text-rose-500">
            ⚠️ Allocations exceed your projected budget by ₦{(totalEstimated - proposedBudget).toLocaleString()}
          </p>
        )}
      </div>

      {/* Item List */}
      <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-hide">
        {budgetItems.length > 0 ? (
          budgetItems.map((item, index) => {
            const { description, color } = parseItemDescription(item.description, index);
            const spent = item.actualCost ?? 0;
            return (
              <div key={item.id} className="group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-800 group-hover:text-pink-600 transition-colors">
                        {description}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Spent: ₦{spent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-gray-700">
                      ₦{item.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>
                {index < budgetItems.length - 1 && (
                  <div className="h-px bg-gray-50 mt-3" />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl bg-gray-50/20">
            <p className="text-xs">No items added to budget yet.</p>
            {!isPast && (
              <button
                onClick={onManage}
                className="mt-3 text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors"
              >
                Add Budget Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
