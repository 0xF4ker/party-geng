"use client";

import React, { useState } from "react";
import { Plus, PiggyBank, Calendar, ArrowUpRight } from "lucide-react";
import { api } from "@/trpc/react";
import { CreatePlanModal } from "@/app/_components/isave/CreatePlanModal";
import Link from "next/link";
import { toast } from "sonner";

const ISavePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: plans, isLoading, refetch } = api.savePlan.getAll.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <PiggyBank className="h-8 w-8 text-pink-600" />
              iSave
            </h1>
            <p className="mt-1 text-gray-600">
              Automated savings for your next big event.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-pink-700"
          >
            <Plus className="h-5 w-5" />
            Create Plan
          </button>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading your plans...</p>
            </div>
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Link href={`/isave/${plan.id}`} key={plan.id}>
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                  {/* Progress Bar Background */}
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-pink-100 transition-all group-hover:h-1.5"
                    style={{ width: "100%" }}
                  >
                    <div
                      className="h-full bg-pink-600"
                      style={{
                        width: `${Math.min(
                          (plan.currentAmount / plan.targetAmount) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600">
                        {plan.title}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {plan.frequency.toLowerCase()} •{" "}
                        {plan.status.toLowerCase()}
                      </p>
                    </div>
                    <div className="rounded-full bg-pink-50 p-2 text-pink-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900">
                      ₦{plan.currentAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      of ₦{plan.targetAmount.toLocaleString()} goal
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    Target:{" "}
                    {new Date(plan.targetDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <PiggyBank className="mb-4 h-16 w-16 text-gray-200" />
            <h3 className="text-lg font-semibold text-gray-900">
              No savings plans yet
            </h3>
            <p className="mt-1 mb-6 max-w-sm text-gray-500">
              Start saving for your dream event today. Create a plan to automate
              your savings.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
            >
              Start Saving
            </button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreatePlanModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            void refetch();
            setIsCreateModalOpen(false);
            toast.success("Savings plan created successfully!");
          }}
        />
      )}
    </div>
  );
};

export default ISavePage;
