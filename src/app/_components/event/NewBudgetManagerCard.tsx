"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaWallet } from "react-icons/fa";
import { MdFiberManualRecord } from "react-icons/md";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Budget = EventDetails["budget"];

interface NewBudgetManagerCardProps {
  budget: Budget;
  _eventId: string;
  onManage: () => void;
  isPast?: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

interface CustomTooltipPayload {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    total: number;
  };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
}) => {
  if (active && payload?.length) {
    const firstPayloadItem = payload[0];
    if (
      firstPayloadItem?.name !== undefined &&
      firstPayloadItem.value !== undefined
    ) {
      // Calculate percentage based on the payload's totalEstimated property
      const total = firstPayloadItem.payload.total ?? 1;
      const percentage = (firstPayloadItem.value / total) * 100;

      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-xl">
          <p className="font-bold text-gray-900">{`${firstPayloadItem.name}`}</p>
          <p className="text-gray-500">{`Budgeted: ₦${firstPayloadItem.value.toLocaleString()}`}</p>
          <p className="mt-1 text-xs">{`Share: ${percentage.toFixed(1)}%`}</p>
        </div>
      );
    }
  }
  return null;
};

export const NewBudgetManagerCard = ({
  budget,
  _eventId,
  onManage,
  isPast = false,
}: NewBudgetManagerCardProps) => {
  const budgetItems = budget?.items ?? [];
  const totalEstimated = budgetItems.reduce(
    (acc, item) => acc + item.estimatedCost,
    0,
  );
  const totalActual = budgetItems.reduce(
    (acc, item) => acc + (item.actualCost ?? 0),
    0,
  );
  const percentageSpent =
    totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;

  // Prepare data for the pie chart
  const data = budgetItems
    .map((item) => ({
      name: item.description,
      value: item.estimatedCost,
      total: totalEstimated, // Pass total estimated for use in the tooltip
    }))
    .filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Budget Tracker
            {isPast && <Lock className="h-4 w-4 text-gray-400" />}
          </CardTitle>
          <Button
            onClick={onManage}
            variant="outline"
            size="sm"
            disabled={isPast}
          >
            <FaWallet className="mr-2 h-4 w-4" />
            {isPast ? "Final Budget" : "Manage Budget"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- SECTION 1: Summary (Chart + Totals) --- */}
        <div className="flex flex-col items-start gap-6 md:flex-row">
          {/* 1.1 Pie Chart Container */}
          <div className="relative h-56 w-full min-w-[200px] md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  isAnimationActive={true}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-sm font-semibold text-gray-500">Total Spent</p>
              <p className="text-2xl font-extrabold text-gray-900">
                ₦{totalActual.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                of ₦{totalEstimated.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 1.2 Custom Legend/Budget Overview */}
          <div className="w-full space-y-3 md:w-1/2">
            <h3 className="mb-2 text-lg font-semibold">Budget Allocation</h3>
            {data.length > 0 ? (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                {data.map((entry, index) => {
                  const percent = (entry.value / totalEstimated) * 100;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <MdFiberManualRecord
                          className="mr-2 h-4 w-4"
                          style={{ color: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-gray-700">
                          {entry.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">
                          {percent.toFixed(1)}%
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          (₦{entry.value.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {isPast
                  ? "No budget data recorded."
                  : "No estimated budget items added yet."}
              </p>
            )}
          </div>
        </div>

        {/* --- SECTION 2: Global Progress Bar --- */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Progress</span>
            <span className="text-sm font-bold text-gray-900">
              {percentageSpent.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(percentageSpent, 100)}
            className="h-2 bg-gray-100"
          />
          {percentageSpent > 100 && (
            <p className="mt-1 text-xs font-medium text-red-600">
              Budget Overrun! You have spent{" "}
              {(percentageSpent - 100).toFixed(0)}% more than estimated.
            </p>
          )}
        </div>

        {/* --- SECTION 3: Detailed Item List --- */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <h3 className="text-lg font-semibold">Detailed Item Spending</h3>
          {budgetItems.length > 0 ? (
            <div className="space-y-4">
              {budgetItems.map((item, index) => {
                const progress =
                  item.estimatedCost > 0
                    ? ((item.actualCost ?? 0) / item.estimatedCost) * 100
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 items-center gap-4"
                  >
                    {/* Item Name and Color Marker */}
                    <div className="col-span-4 flex items-center sm:col-span-1">
                      <MdFiberManualRecord
                        className="mr-2 h-4 w-4 min-w-4"
                        style={{ color: COLORS[index % COLORS.length] }}
                      />
                      <span
                        className="truncate text-sm font-medium"
                        title={item.description}
                      >
                        {item.description}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="col-span-4 sm:col-span-2">
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-2 bg-gray-100"
                      />
                    </div>

                    {/* Actual / Estimated Cost */}
                    <div className="col-span-4 text-right sm:col-span-1">
                      <span className="font-mono text-sm text-gray-800">
                        ₦{(item.actualCost ?? 0).toLocaleString()}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        / ₦{item.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isPast
                ? "No items were added to the budget."
                : 'Start managing your budget by clicking "Manage Budget" to add items.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
