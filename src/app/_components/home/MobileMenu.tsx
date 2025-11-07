import React, { useState, useEffect } from "react";
import { X, ChevronRight, ArrowLeft } from "lucide-react";
import { categoriesData } from "./../../local/categoryv2";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { type Profile } from "@/stores/auth";

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
  const [currentCategory, setCurrentCategory] = useState<
    (typeof categoriesData)[0] | null
  >(null);

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

  const handleCategoryClick = (category: (typeof categoriesData)[0]) => {
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
                <button
                  onClick={() => openModal("join")}
                  className="w-full rounded-md bg-pink-500 px-4 py-2.5 text-lg font-bold text-white hover:bg-pink-600"
                >
                  Join Partygeng
                </button>
                <button
                  onClick={() => openModal("login")}
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
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Partygeng Pro
                  </a>
                  <a
                    href="/start_selling"
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
                  <Link
                    href="/v/dashboard"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage_orders"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/earnings"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Earnings
                  </Link>
                  <Link
                    href={`/c/${user.id}`}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Public Profile
                  </Link>
                  <Link
                    href="/settings"
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
                  <Link
                    href="/c/manage_events"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    My Events
                  </Link>
                  <Link
                    href="/manage_orders"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/inbox"
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Inbox
                  </Link>
                  <Link
                    href="/notifications"
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
                    href={`/c/${user.id}`}
                    className="block text-base font-medium text-gray-700 hover:text-pink-500"
                  >
                    Public Profile
                  </a>
                  <a
                    href="/settings"
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
              if (typeof service === "string") {
                return (
                  <Link
                    key={service}
                    href={`/categories/${
                      currentCategory.name
                    }/${service.toLowerCase().replace(/ /g, "-")}`}
                    className="border-b border-gray-100 p-4 text-base text-gray-700 hover:bg-gray-50"
                  >
                    {service}
                  </Link>
                );
              }
              // NOTE: As of now, no category uses ServiceGroup, but this handles it.
              return (
                <div key={service.groupName}>
                  <h4 className="p-4 font-semibold text-gray-500">
                    {service.groupName}
                  </h4>
                  {service.items.map((item) => (
                    <Link
                      key={item}
                      href={`/categories/${
                        currentCategory.name
                      }/${item.toLowerCase().replace(/ /g, "-")}`}
                      className="border-b border-gray-100 p-4 pl-8 text-base text-gray-700 hover:bg-gray-50"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
