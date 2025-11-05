"use client";
import React from "react";
import Hero from "../_components/home/Hero";
import PopularServices from "../_components/home/PopularServices";
import FeaturesSection from "../_components/home/FeaturesSection";
import CTASection from "../_components/home/CTASection";
import HowItWorks from "../_components/home/HowItWorks";

const HomePage = () => {
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
