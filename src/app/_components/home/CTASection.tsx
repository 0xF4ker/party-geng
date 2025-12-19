"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

const CTASection = () => {
  const { profile } = useAuthStore();

  const becomeVendorHref = profile ? "/dashboard" : "/join";
  const planEventHref = profile ? "/manage_events" : "/login";

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-purple-700 via-purple-600 to-pink-600 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-20">
            <div className="h-64 w-64 rounded-full bg-white blur-3xl"></div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 opacity-20">
            <div className="h-80 w-80 rounded-full bg-pink-400 blur-3xl"></div>
          </div>
          
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-purple-100 backdrop-blur-sm">
                <Sparkles className="mr-2 h-4 w-4 text-yellow-300" />
                Join Nigeria's Fastest Growing Event Network
              </span>
            </div>
            
            <h2 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
              Ready to Turn Your Passion into Profit?
            </h2>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-purple-100 sm:text-xl">
              Whether you're a DJ, photographer, caterer, or venue owner, 
              PartyGeng connects you with clients looking for your specific talents.
              Create your profile today and start getting booked.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={becomeVendorHref}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-8 py-4 text-lg font-bold text-purple-700 transition-all hover:bg-gray-50 hover:shadow-lg hover:shadow-purple-900/20"
              >
                <span className="relative z-10">Become a Vendor</span>
                <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-purple-100/50 to-transparent transition-transform duration-700 group-hover:animate-shimmer"></div>
              </Link>
              
              <Link
                href={planEventHref}
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Planning an Event?
              </Link>
            </div>
            
            <p className="mt-8 text-sm text-purple-200">
              Free to join • Secure payments • 24/7 Support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
