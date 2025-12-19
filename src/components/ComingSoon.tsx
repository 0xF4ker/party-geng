"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import { useUiStore } from "@/stores/ui";

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description = "We are working hard to bring this feature to life. Stay tuned!",
}) => {
  const { headerHeight } = useUiStore();

  return (
    <div 
      className="flex min-h-[70vh] flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12"
      style={{ paddingTop: headerHeight ? `${headerHeight + 48}px` : undefined }}
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon/Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-pink-100 p-6 ring-8 ring-pink-50">
            <Rocket className="h-16 w-16 text-pink-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="brand-text-gradient mb-6 text-5xl font-bold sm:text-6xl">
          Coming Soon
        </h1>

        {/* Subtitle */}
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          {title}
        </h2>

        {/* Description */}
        <p className="mb-10 text-lg text-gray-600">
          {description}
        </p>

        {/* Action Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-8 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-pink-700 hover:shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
