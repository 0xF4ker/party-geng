import React from 'react';

const FeaturesSection = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything You Need for Perfect Events
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From planning to execution, connect with the best vendors and
            create unforgettable experiences.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon bg-pink-100 text-pink-500">
              <i className="fas fa-search text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Find Amazing Vendors
            </h3>
            <p className="text-gray-600">
              Discover trusted vendors in your area with verified reviews and
              portfolios.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon bg-purple-100 text-purple-500">
              <i className="fas fa-calendar-alt text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Smart Planning Tools
            </h3>
            <p className="text-gray-600">
              Organize every detail with our comprehensive planning and
              budgeting tools.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon bg-blue-100 text-blue-500">
              <i className="fas fa-users text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Social Community
            </h3>
            <p className="text-gray-600">
              Share your events, get inspired, and connect with fellow event
              enthusiasts.
            </p>
          </div>
          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon bg-red-100 text-red-500">
              <i className="fas fa-heart text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Save Favorites
            </h3>
            <p className="text-gray-600">
              Keep track of your favorite vendors and venues for future
              events.
            </p>
          </div>
          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-icon bg-indigo-100 text-indigo-500">
              <i className="fas fa-camera-retro text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Event Gallery
            </h3>
            <p className="text-gray-600">
              Showcase your beautiful events and inspire others in the
              community.
            </p>
          </div>
          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-icon bg-yellow-100 text-yellow-500">
              <i className="fas fa-star text-2xl"></i>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Reviews & Ratings
            </h3>
            <p className="text-gray-600">
              Make informed decisions with authentic reviews from real
              customers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
