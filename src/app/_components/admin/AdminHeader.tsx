"use client";

import { useAuthStore } from "@/stores/auth";
import { Bell, Search } from "lucide-react";

export function AdminHeader() {
  const { profile, isLoading } = useAuthStore();
  return (
    <header className="flex h-20 items-center justify-between px-6 lg:px-10">
      {/* Mobile Logo (Visible only on small screens) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600">
          <span className="font-bold text-white">P</span>
        </div>
        <span className="font-bold text-gray-900">Admin</span>
      </div>

      {/* Desktop Search (Hidden on mobile) */}
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-64 rounded-full border border-gray-200 bg-white pr-4 pl-10 text-sm transition-all outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-pink-600 ring-2 ring-white"></span>
        </button>

        <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {profile?.username ?? profile?.email?.split("@")[0]}
            </p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm">
            <div className="flex h-full w-full items-center justify-center font-bold text-gray-500">
              {profile?.email?.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
