import React from "react";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl bg-purple-600 p-8 text-center text-white sm:p-12">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
          <div className="absolute -right-5 -bottom-16 h-48 w-48 rounded-full bg-white/10"></div>
          <h2 className="text-3xl font-bold">
            Ready to Create Amazing Events?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl">
            Join thousands of event planners and vendors who trust Partygeng for
            their special occasions.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block transform rounded-full bg-white px-8 py-3 font-semibold text-purple-600 shadow-lg transition-transform hover:scale-105 hover:bg-gray-100"
          >
            Join the Community &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
