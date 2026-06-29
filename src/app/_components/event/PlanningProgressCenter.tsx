"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, AlertCircle, Sparkles, ChevronRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HireCoordinatorModal } from "./modals/HireCoordinatorModal";

interface PlanningProgressCenterProps {
  event: {
    id: string;
    title: string;
    coordinatorId: string | null;
    coordinator?: {
      id: string;
      name: string | null;
      user: { username: string; email: string };
    } | null;
    budget?: {
      items: Array<{ id: string }>;
    } | null;
    guestLists: Array<{
      guests: Array<{ id: string }>;
    }>;
    boardPosts: Array<{ id: string }>;
  };
  onScrollToSection: (section: string) => void;
}

export function PlanningProgressCenter({
  event,
  onScrollToSection,
}: PlanningProgressCenterProps) {
  const [isHireOpen, setIsHireOpen] = useState(false);

  // Compute milestones
  const hasGuests = event.guestLists.some((gl) => gl.guests.length > 0);
  const hasBudget = (event.budget?.items?.length ?? 0) > 0;
  const hasMoodboard = event.boardPosts.length > 0;
  const hasCoordinator = !!event.coordinatorId;

  const milestones = [
    { id: "guests", label: "Add Guest List", completed: hasGuests, desc: "Invite guests & set RSVPs", target: "guests" },
    { id: "budget", label: "Set Event Budget", completed: hasBudget, desc: "Outline your estimated expenses", target: "budget" },
    { id: "moodboard", label: "Pin Moodboard Ideas", completed: hasMoodboard, desc: "Add pins to collaborative board", target: "board" },
    { id: "coordinator", label: "Hire Coordinator", completed: hasCoordinator, desc: "Enlist platform-managed help", target: "coordinator" },
  ];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = (completedCount / milestones.length) * 100;

  // Determine the next recommendation
  const nextMilestone = milestones.find((m) => !m.completed);

  const handleNextAction = (target: string) => {
    if (target === "coordinator") {
      setIsHireOpen(true);
    } else if (target === "board") {
      window.location.href = `/event/${event.id}/board`;
    } else {
      onScrollToSection(target);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Planning Progress Tracker
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete milestones to build the perfect event ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-black text-slate-800">{progressPercent}%</span>
        </div>
      </div>

      {/* Grid of milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {milestones.map((m) => (
          <div
            key={m.id}
            onClick={() => handleNextAction(m.target)}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm",
              m.completed
                ? "border-green-100 bg-green-50/20 text-green-800"
                : "border-gray-100 bg-white hover:border-pink-100"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                {m.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {m.completed ? "Done" : "Pending"}
                </span>
              </div>
              <h4 className="font-bold text-sm text-gray-900 leading-tight">{m.label}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{m.desc}</p>
            </div>
            <div className="flex justify-end mt-4">
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Next Suggestion recommendation box */}
      {nextMilestone ? (
        <div className="rounded-xl border border-pink-100 bg-pink-50/20 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-pink-50 p-2 text-pink-600 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Suggested Next Step</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                We recommend configuring the <strong>{nextMilestone.label}</strong> module to stay on track.
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleNextAction(nextMilestone.target)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm shrink-0"
          >
            Resolve This Now
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-green-150 bg-green-50/25 p-5 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">All Milestones Completed!</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Awesome work! Your event is fully set up with tickets, budgets, design boards, and coordinator support.
            </p>
          </div>
        </div>
      )}

      {/* Hire Coordinator Modal popup */}
      <HireCoordinatorModal
        event={event}
        isOpen={isHireOpen}
        onClose={() => setIsHireOpen(false)}
      />
    </div>
  );
}
