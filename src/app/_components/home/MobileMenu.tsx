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
// 1. Get the type for the entire procedure's output (which can be null)
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
  const isVendor =
    user?.vendorProfile !== null && user?.vendorProfile !== undefined;
  // const isClient = user?.clientProfile !== null && user?.clientProfile !== undefined;
  const isGuest = !user;
  const [currentView, setCurrentView] = useState("main"); // 'main' or category name
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Fetch categories from database
  const { data: categoriesData = [] } = api.category.getAll.useQuery();

  // Reset view when menu is closed
  useEffect(() => {
    if (!isOpen) {
      // Add a delay to allow the animation to finish before resetting
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
    // Delay clearing the category to prevent content from disappearing during transition
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

      {/* Menu Content Wrapper (for sliding panels) */}
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
              // Guest Links
              <>
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

                <div className="space-y-5">
                  <a
                    href="/pro"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Partygeng Pro
                  </a>
                  <a
                    href="/start_selling"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Become a Vendor
                  </a>
                </div>
              </>
            ) : isVendor ? (
              // Vendor Links
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
                    href="/earnings"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Earnings
                  </Link>
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
              // Client Links
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
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Inbox
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

                  <a
                    href={`/c/${user.username}`}
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Profile
                  </a>
                  <a
                    href="/settings"
                    onClick={onClose}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Settings
                  </a>
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

        {/* Category Sub-Panel */}
        <div
          className={cn(
            "absolute inset-0 transform overflow-y-auto bg-white transition-transform duration-300 ease-in-out",
            currentView === "category" ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Sticky Header */}
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
            {/* Moved border up to be part of sticky header */}
          </div>
          <div className="flex flex-col border-t border-gray-200">
            {currentCategory?.services.map((service) => {
              // Convert category and service names to slugs
              const categorySlug = currentCategory.slug;
              const serviceSlug = service.slug;
              const vendorsCount = service._count.vendors;

              return (
                <Link
                  key={service.id}
                  href={`/categories/${categorySlug}/${serviceSlug}`}
                  className="flex items-center justify-between border-b border-gray-100 p-4 text-base text-gray-700 hover:bg-gray-50"
                  onClick={onClose}
                >
                  <span>{service.name}</span>
                  <span className="text-sm text-gray-400">
                    ({vendorsCount})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
