import React from "react";
import { cn } from "@/lib/utils";

// --- 1. Sidebar List Skeleton ---
export const ConversationListSkeleton = () => {
  return (
    <div className="flex h-full animate-pulse flex-col bg-white">
      {/* Search Header Skeleton */}
      <div className="border-b border-gray-100 p-4">
        <div className="mb-4 h-6 w-24 rounded bg-gray-200"></div>
        <div className="h-10 w-full rounded-xl bg-gray-100"></div>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-gray-50 p-4"
          >
            {/* Avatar */}
            <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" />

            {/* Text Lines */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-1/3 rounded bg-gray-200" /> {/* Name */}
                <div className="h-3 w-10 rounded bg-gray-100" /> {/* Time */}
              </div>
              <div className="h-3 w-3/4 rounded bg-gray-100" />{" "}
              {/* Last Message */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 2. Main Chat Area Skeleton ---
export const ChatMessagesSkeleton = () => {
  return (
    <div className="flex-1 animate-pulse space-y-6 overflow-hidden bg-[#efeae2] p-4">
      {/* Incoming (Left) */}
      <div className="flex justify-start">
        <div className="h-12 w-2/3 max-w-[300px] rounded-2xl rounded-bl-none bg-gray-200" />
      </div>

      {/* Outgoing (Right) */}
      <div className="flex justify-end">
        <div className="h-16 w-1/2 max-w-[300px] rounded-2xl rounded-br-none bg-gray-300/50" />
      </div>

      {/* Incoming (Left - Short) */}
      <div className="flex justify-start">
        <div className="h-10 w-1/3 max-w-[200px] rounded-2xl rounded-bl-none bg-gray-200" />
      </div>

      {/* Outgoing (Right - Long) */}
      <div className="flex justify-end">
        <div className="h-24 w-3/4 max-w-[400px] rounded-2xl rounded-br-none bg-gray-300/50" />
      </div>

      {/* Incoming (Left) */}
      <div className="flex justify-start">
        <div className="h-12 w-1/2 max-w-[300px] rounded-2xl rounded-bl-none bg-gray-200" />
      </div>
    </div>
  );
};

// --- 3. Profile Sidebar Skeleton ---
export const UserInfoSkeleton = () => {
  return (
    <div className="flex h-full animate-pulse flex-col bg-white p-8">
      <div className="flex flex-col items-center border-b border-gray-100 pb-8">
        <div className="mb-4 h-24 w-24 rounded-full bg-gray-200" />
        <div className="mb-2 h-6 w-32 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-100" />
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-12 w-full rounded-xl bg-gray-100" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-gray-50" />
          <div className="h-4 w-2/3 rounded bg-gray-50" />
          <div className="h-4 w-3/4 rounded bg-gray-50" />
        </div>
      </div>
    </div>
  );
};
