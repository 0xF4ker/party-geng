import React from 'react';
import Hero from './_components/home/Hero';
import PopularServices from './_components/home/PopularServices';
import FeaturesSection from './_components/home/FeaturesSection';
import CTASection from './_components/home/CTASection';

const HomePage = () => {
  return (
    <main>
      <Hero />
      <PopularServices />
      <FeaturesSection />
      <CTASection />
    </main>
  );
};

export default HomePage;
