import React from 'react';
import Header from './_components/home/Header';
import Hero from './_components/home/Hero';
import PopularServices from './_components/home/PopularServices';
import FeaturesSection from './_components/home/FeaturesSection';
import CTASection from './_components/home/CTASection';
import Footer from './_components/home/Footer';

const HomePage = () => {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <PopularServices />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;