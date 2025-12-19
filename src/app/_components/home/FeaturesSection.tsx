import React from 'react';
import { Search, Calendar, Users, Heart, Camera, Star } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: "Find Your Perfect Match",
      description: "Discover verified vendors that match your style and budget. From DJs to decorators, we've got you covered.",
      color: "text-pink-600 bg-pink-100",
    },
    {
      icon: Calendar,
      title: "Stress-Free Planning",
      description: "Stay organized with our smart tools. Manage guest lists, budgets, and timelines all in one place.",
      color: "text-purple-600 bg-purple-100",
    },
    {
      icon: Users,
      title: "Join the Party",
      description: "Connect with a vibrant community of party lovers. Share tips, get advice, and find inspiration.",
      color: "text-blue-600 bg-blue-100",
    },
    {
      icon: Heart,
      title: "Save What You Love",
      description: "Build your dream event board. Save your favorite vendors and ideas for when you're ready to book.",
      color: "text-red-600 bg-red-100",
    },
    {
      icon: Camera,
      title: "Showcase Your Style",
      description: "Share your event photos and build your portfolio. Let the world see your creativity in action.",
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      icon: Star,
      title: "Trust & Transparency",
      description: "Read real reviews from real clients. Book with confidence knowing you're getting quality service.",
      color: "text-yellow-600 bg-yellow-100",
    },
  ];

  return (
    <section className="bg-gray-50/50 py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything You Need for <span className="text-pink-600">Unforgettable Events</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            We've built a complete ecosystem to help you plan, book, and celebrate without the hassle.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="feature-card group relative overflow-hidden bg-white p-8">
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-pink-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              
              <div className="relative z-10">
                <div className={`feature-icon mb-6 ${feature.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
