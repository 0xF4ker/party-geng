import React, { useState, useEffect } from "react";
import { X, ChevronRight, ArrowLeft, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { type Profile } from "@/stores/auth";
import { api } from "@/trpc/react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
type CategoryOutput = routerOutput["category"]["getAll"][number];
type Category = NonNullable<CategoryOutput>;

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  openModal: (view: "login" | "join") => void;
  user?: Profile | null;
  signOut?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  openModal,
  user,
  signOut,
}) => {
  const isVendor = user?.role === "VENDOR"; // Simplified check
  const isGuest = !user;
  const [currentView, setCurrentView] = useState("main");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categoriesData = [] } = api.category.getAll.useQuery();

  // Fetch unread count for badge
  const { data: unreadConvoCount } =
    api.chat.getUnreadConversationCount.useQuery(undefined, {
      enabled: !!user,
    });

  // Reset view when menu is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentView("main");
        setCurrentCategory(null);
      }, 300);
    }
  }, [isOpen]);

  const handleCategoryClick = (category: Category) => {
    setCurrentCategory(category);
    setCurrentView("category");
  };

  const handleBackClick = () => {
    setCurrentView("main");
    setTimeout(() => {
      setCurrentCategory(null);
    }, 300);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      ></div>

      {/* Menu Content */}
      <div className="relative flex h-full w-full max-w-xs flex-col overflow-hidden bg-white shadow-xl">
        {/* Main Panel */}
        <div
          className={cn(
            "absolute inset-0 transform overflow-y-auto transition-transform duration-300 ease-in-out",
            currentView === "main" ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between p-4">
            <h2 className="text-2xl font-bold text-pink-500">Partygeng</h2>
            <button onClick={onClose}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex flex-col space-y-5 p-4">
            {isGuest ? (
              // Guest Links (unchanged)
              <>
                <button
                  onClick={() => {
                    openModal("join");
                    onClose();
                  }}
                  className="w-full rounded-md bg-pink-500 px-4 py-2.5 text-lg font-bold text-white hover:bg-pink-600"
                >
                  Join Partygeng
                </button>
                <button
                  onClick={() => {
                    openModal("login");
                    onClose();
                  }}
                  className="text-left text-base font-medium text-gray-700 hover:text-pink-500"
                >
                  Sign in
                </button>
                <div className="">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="categories">
                      <AccordionTrigger>Browse categories</AccordionTrigger>
                      <AccordionContent>
                        <div className="ml-6 flex flex-col space-y-3">
                          {categoriesData.map((category) => (
                            <button
                              key={category.name}
                              onClick={() => handleCategoryClick(category)}
                              className="flex items-center justify-between text-base font-medium text-gray-700 hover:text-pink-500"
                            >
                              {category.name}
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                {/* Other Guest Links... */}
              </>
            ) : isVendor ? (
              // --- UPDATED VENDOR LINKS ---
              <>
                <div className="space-y-5">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-linear-to-r from-orange-400 to-pink-500 text-lg font-bold text-white hover:from-orange-500 hover:to-pink-600"
                  >
                    <Link href="/trending" onClick={onClose}>
                      <Flame className="mr-1 h-5 w-5" />
                      Trending
                    </Link>
                  </Button>

                  {/* Added Inbox & Notifications for Vendors */}
                  <Link
                    href="/inbox"
                    onClick={onClose}
                    className="flex items-center justify-between text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Inbox
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="rounded-full bg-pink-600 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadConvoCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Notifications
                  </Link>

                  <div className="my-2 h-px w-full bg-gray-100" />

                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage_orders"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Wallet
                  </Link>

                  <div className="my-2 h-px w-full bg-gray-100" />

                  <Link
                    href={`/v/${user.username}`}
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut?.();
                      onClose();
                    }}
                    className="block w-full text-left text-base font-medium text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              // Client Links (unchanged)
              <>
                <div className="space-y-5">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-linear-to-r from-orange-400 to-pink-500 text-lg font-bold text-white hover:from-orange-500 hover:to-pink-600"
                  >
                    <Link href="/trending" onClick={onClose}>
                      <Flame className="mr-1 h-5 w-5" />
                      Trending
                    </Link>
                  </Button>
                  <Link
                    href="/manage_events"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    My Events
                  </Link>
                  <Link
                    href="/manage_orders"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/inbox"
                    onClick={onClose}
                    className="flex items-center justify-between text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Inbox
                    {(unreadConvoCount ?? 0) > 0 && (
                      <span className="rounded-full bg-pink-600 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadConvoCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Notifications
                  </Link>
                  <div className="">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="categories">
                        <AccordionTrigger>Browse categories</AccordionTrigger>
                        <AccordionContent>
                          <div className="ml-6 flex flex-col space-y-3">
                            {categoriesData.map((category) => (
                              <button
                                key={category.name}
                                onClick={() => handleCategoryClick(category)}
                                className="flex items-center justify-between text-base font-medium text-gray-700 hover:text-pink-500"
                              >
                                {category.name}
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <Link
                    href={`/c/${user.username}`}
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut?.();
                      onClose();
                    }}
                    className="block w-full text-left text-base font-medium text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Category Sub-Panel (unchanged) */}
        <div
          className={cn(
            "absolute inset-0 transform overflow-y-auto bg-white transition-transform duration-300 ease-in-out",
            currentView === "category" ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* ... category sub-panel code ... */}
          {/* (Kept concise here, same as your previous code) */}
          <div className="sticky top-0 z-10 shrink-0 bg-white">
            <div className="flex items-center p-4">
              <button
                onClick={handleBackClick}
                className="-ml-2 p-2 text-gray-600 hover:text-pink-500"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h3 className="ml-2 text-lg font-semibold text-gray-800">
                {currentCategory?.name}
              </h3>
            </div>
            <div className="border-t border-gray-200"></div>
          </div>
          <div className="flex flex-col border-t border-gray-200">
            {currentCategory?.services.map((service) => (
              <Link
                key={service.id}
                href={`/categories/${currentCategory.slug}/${service.slug}`}
                className="flex items-center justify-between border-b border-gray-100 p-4 text-base text-gray-700 hover:bg-gray-50"
                onClick={onClose}
              >
                <span>{service.name}</span>
                <span className="text-sm text-gray-400">
                  ({service._count.vendors})
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
