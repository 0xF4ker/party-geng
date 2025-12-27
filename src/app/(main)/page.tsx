"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Loader2 } from "lucide-react";
import Hero from "../_components/home/Hero";
import PopularServices from "../_components/home/PopularServices";
import FeaturesSection from "../_components/home/FeaturesSection";
import CTASection from "../_components/home/CTASection";
import HowItWorks from "../_components/home/HowItWorks";

const HomePage = () => {
  const { profile, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If not loading and we have a user profile, redirect
    if (!isLoading && profile) {
      const isVendor = profile.role === "VENDOR";
      const targetUrl = isVendor
        ? `/v/${profile.username}`
        : `/c/${profile.username}`;

      router.replace(targetUrl);
    }
  }, [profile, isLoading, router]);

  // Optionally show a full-screen loader while the redirect decision is happening
  // to prevent the Home Page flashing for 0.5s before redirect.
  if (isLoading || profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <main>
      <Hero />
      <PopularServices />
      <HowItWorks />
      <FeaturesSection />
      <CTASection />
    </main>
  );
};

export default HomePage;
