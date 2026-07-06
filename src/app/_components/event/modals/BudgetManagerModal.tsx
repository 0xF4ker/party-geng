"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Trash2, Check, Edit3, X, Gift, Plus } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];

interface BudgetManagerModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

const BUDGET_COLORS = [
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
  if (!rawDescription) return { description: "", color: BUDGET_COLORS[index % BUDGET_COLORS.length]! };
  const parts = rawDescription.split("::");
  return {
    description: parts[0] || "",
    color: parts[1] || BUDGET_COLORS[index % BUDGET_COLORS.length]!,
  };
};

export const BudgetManagerModal = ({
  event,
  isOpen,
  onClose,
}: BudgetManagerModalProps) => {
  const utils = api.useUtils();
  const budget = event.budget;
  const proposedBudget = (event.questionnaireData as any)?.roughBudget ?? 0;

  // Edit states
  const [isEditingProposed, setIsEditingProposed] = useState(false);
  const [tempProposed, setTempProposed] = useState(proposedBudget.toString());

  // Add Item states
  const [newItemName, setNewItemName] = useState("");
  const [newItemEstimate, setNewItemEstimate] = useState("");
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]!);

  // Mutations
  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toast.success("Proposed budget updated!");
      setIsEditingProposed(false);
      void utils.event.getById.invalidate({ id: event.id });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update proposed budget");
    },
  });

  const addBudgetItem = api.event.addBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Budget item added!");
      setNewItemName("");
      setNewItemEstimate("");
      void utils.event.getById.invalidate({ id: event.id });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add budget item");
    },
  });

  const updateBudgetItem = api.event.updateBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Budget item updated!");
      void utils.event.getById.invalidate({ id: event.id });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update budget item");
    },
  });

  const deleteBudgetItem = api.event.deleteBudgetItem.useMutation({
    onSuccess: () => {
      toast.success("Budget item deleted!");
      void utils.event.getById.invalidate({ id: event.id });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete budget item");
    },
  });

  if (!budget) return null;

  const budgetItems = budget.items ?? [];
  const totalEstimated = budgetItems.reduce((acc, item) => acc + item.estimatedCost, 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + (item.actualCost ?? 0), 0);
  const unspent = totalEstimated - totalActual;

  // Largest allocation slice
  const largestItem = budgetItems.reduce((max, item) => (item.estimatedCost > (max?.estimatedCost ?? 0) ? item : max), budgetItems[0]);
  const largestPercentage = totalEstimated > 0 && largestItem ? (largestItem.estimatedCost / totalEstimated) * 100 : 0;

  // Chart data
  const chartData = budgetItems
    .map((item, index) => {
      const { description, color } = parseItemDescription(item.description, index);
      return {
        name: description,
        value: item.estimatedCost,
        color,
      };
    })
    .filter((item) => item.value > 0);

  const handleUpdateProposed = () => {
    const val = Number(tempProposed);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    const currentQuestionnaire = (event.questionnaireData as Record<string, any>) || {};
    updateEvent.mutate({
      id: event.id,
      questionnaireData: {
        ...currentQuestionnaire,
        roughBudget: val,
      },
    });
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemEstimate) return;
    const est = Number(newItemEstimate);
    if (isNaN(est) || est <= 0) {
      toast.error("Please enter a valid estimate");
      return;
    }
    const finalDescription = `${newItemName.trim()}::${selectedColor}`;
    addBudgetItem.mutate({
      budgetId: budget.id,
      description: finalDescription,
      estimatedCost: est,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-5xl lg:max-w-6xl w-full bg-white text-gray-900 border border-gray-150 rounded-3xl p-0 overflow-hidden shadow-2xl focus:outline-none">
        <div className="flex flex-col md:flex-row h-[85vh] md:h-[680px]">
          
          {/* ====================================================
              COLUMN 1: INSIGHTS & INLINE ADD FORM (Left 35%)
             ==================================================== */}
          <div className="w-full md:w-[35%] bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col p-6 overflow-y-auto scrollbar-hide">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5">
              Budget Analytics
            </h2>

            {/* Circular Donut allocation chart */}
            <div className="relative h-44 w-full flex items-center justify-center my-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        fill="#8884d8"
                        paddingAngle={1}
                        dataKey="value"
                        labelLine={false}
                        isAnimationActive={true}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute h-[96px] w-[96px] rounded-full bg-white flex flex-col items-center justify-center border border-gray-50 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Largest Share</span>
                    <span className="text-sm font-black text-gray-800 font-mono mt-0.5">
                      {largestPercentage.toFixed(0)}%
                    </span>
                    <span className="text-[8px] text-gray-500 truncate max-w-[70px] font-semibold mt-0.5" title={largestItem?.description.split("::")[0]}>
                      {largestItem?.description.split("::")[0] || ""}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 text-gray-400">
                  <Gift className="h-7 w-7 opacity-30 mb-1" />
                  <p className="text-[10px]">No budget item shares</p>
                </div>
              )}
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAddItemSubmit} className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-pink-600" />
                  Add Budget Item
                </h3>
                <p className="text-[10px] text-gray-400">Allocate a new expense item instantly</p>
              </div>

              {/* Set Budget Item Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Venue, Catering, Cake"
                  required
                  className="h-10 bg-white border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Budget Estimate Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Budgeted Amount (₦)</label>
                <Input
                  type="number"
                  value={newItemEstimate}
                  onChange={(e) => setNewItemEstimate(e.target.value)}
                  placeholder="0"
                  required
                  className="h-10 bg-white border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-pink-500 font-mono font-bold"
                />
              </div>

              {/* Color Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Palette Tag</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={addBudgetItem.isPending}
                className="w-full h-10 mt-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                {addBudgetItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Budget Item"
                )}
              </Button>
            </form>
          </div>

          {/* ====================================================
              COLUMN 2: SUMMARY TILES & EDITABLE BUDGETS (Right 65%)
             ==================================================== */}
          <div className="w-full md:w-[65%] flex flex-col p-6 overflow-y-auto scrollbar-hide">
            
            {/* Header / Close */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Budget Tracker</h2>
                {/* Proposed Edit */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-gray-400 font-medium">Projected Limit:</span>
                  {isEditingProposed ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={tempProposed}
                        onChange={(e) => setTempProposed(e.target.value)}
                        className="w-24 h-7 bg-white border-gray-200 text-gray-900 text-xs font-bold font-mono px-2 py-0.5"
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateProposed()}
                      />
                      <button
                        onClick={handleUpdateProposed}
                        disabled={updateEvent.isPending}
                        className="p-1 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
                      >
                        {updateEvent.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProposed(false);
                          setTempProposed(proposedBudget.toString());
                        }}
                        className="p-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs font-mono text-gray-800">
                        ₦{proposedBudget.toLocaleString()}
                      </span>
                      <button
                        onClick={() => setIsEditingProposed(true)}
                        className="text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>

            {/* Metric Overview Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Allocated</span>
                <span className="text-sm font-black text-gray-800 font-mono block mt-1">
                  ₦{totalEstimated.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Spent</span>
                <span className="text-sm font-black text-amber-500 font-mono block mt-1">
                  ₦{totalActual.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Remaining</span>
                <span className="text-sm font-black text-emerald-500 font-mono block mt-1">
                  ₦{unspent.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Item List and Details */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Expenses Sheet</h3>
              
              <div className="space-y-2.5">
                {budgetItems.map((item, index) => {
                  const { description, color } = parseItemDescription(item.description, index);
                  const isOptimistic = item.id === "optimistic";
                  return (
                    <div key={item.id} className="group border border-gray-100/50 rounded-xl p-3 bg-white shadow-2xs hover:bg-gray-50/20 transition-all duration-200">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        
                        {/* Title Column */}
                        <div className="col-span-5 flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                          <input
                            type="text"
                            defaultValue={description}
                            onBlur={(e) => {
                              const newDesc = e.target.value.trim();
                              if (newDesc && newDesc !== description) {
                                updateBudgetItem.mutate({
                                  itemId: item.id,
                                  description: `${newDesc}::${color}`,
                                });
                              }
                            }}
                            disabled={isOptimistic}
                            className="h-8 w-full bg-transparent border-0 font-semibold text-xs text-gray-800 focus:bg-gray-50 focus:ring-1 focus:ring-pink-500 rounded px-1.5 focus:outline-none"
                          />
                        </div>

                        {/* Estimated Column */}
                        <div className="col-span-3">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold uppercase">Est:</span>
                            <input
                              type="number"
                              defaultValue={item.estimatedCost}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val > 0 && val !== item.estimatedCost) {
                                  updateBudgetItem.mutate({
                                    itemId: item.id,
                                    estimatedCost: val,
                                  });
                                }
                              }}
                              disabled={isOptimistic}
                              className="h-8 w-full bg-gray-50/60 border border-gray-250/70 pl-7 pr-1 rounded-lg text-xs font-bold text-gray-700 font-mono focus:bg-white focus:ring-1 focus:ring-pink-500 focus:border-transparent text-right"
                            />
                          </div>
                        </div>

                        {/* Spent Column */}
                        <div className="col-span-3">
                          <div className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold uppercase">Spent:</span>
                            <input
                              type="number"
                              defaultValue={item.actualCost ?? ""}
                              placeholder="0"
                              onBlur={(e) => {
                                const val = e.target.value;
                                const nextActual = val === "" ? null : Number(val);
                                if (nextActual !== item.actualCost) {
                                  updateBudgetItem.mutate({
                                    itemId: item.id,
                                    actualCost: nextActual,
                                  });
                                }
                              }}
                              disabled={isOptimistic}
                              className="h-8 w-full bg-gray-50/60 border border-gray-250/70 pl-9 pr-1 rounded-lg text-xs font-bold text-gray-700 font-mono focus:bg-white focus:ring-1 focus:ring-pink-500 focus:border-transparent text-right"
                            />
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isOptimistic || deleteBudgetItem.isPending}
                            onClick={() => deleteBudgetItem.mutate({ itemId: item.id })}
                            className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {budgetItems.length === 0 && (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-150 rounded-2xl bg-gray-50/10">
                    <p className="text-xs">No budget items added yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Use the panel on the left to add items.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};