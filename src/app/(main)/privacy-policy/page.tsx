"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const sections = [
  { id: "info-collect", title: "1. Information We Collect" },
  { id: "how-use", title: "2. How We Use Your Information" },
  { id: "how-share", title: "3. How We Share Your Information" },
  { id: "how-protect", title: "4. How We Protect Your Information" },
  { id: "privacy-rights", title: "5. Your Privacy Rights" },
  { id: "data-retention", title: "6. Data Retention" },
  { id: "childrens-privacy", title: "7. Children’s Privacy" },
  { id: "cookies", title: "8. Cookies & Tracking" },
  { id: "international", title: "9. International Data Transfers" },
  { id: "social", title: "10. Social Features & Public Content" },
  { id: "third-party", title: "11. Third-Party Links" },
  { id: "changes", title: "12. Changes to This Privacy Policy" },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -35% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-pink-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Your privacy is important to us. Learn how we handle your data.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Table of Contents - Sticky Sidebar */}
        <aside className="hidden lg:block w-1/4 min-w-[250px] shrink-0">
          <div className="sticky top-24 space-y-1">
            <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">
              Contents
            </h3>
            <nav className="flex flex-col space-y-1 border-l-2 border-gray-100">
              {sections.map(({ id, title }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={cn(
                    "text-left py-2 px-4 text-sm font-medium transition-all hover:text-pink-600 border-l-2 -ml-[2px]",
                    activeSection === id
                      ? "border-pink-600 text-pink-600 bg-pink-50/50"
                      : "border-transparent text-gray-500"
                  )}
                >
                  {title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto lg:mx-0">
          <div className="prose prose-pink prose-lg max-w-none text-gray-600 space-y-12">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <p className="text-sm md:text-base leading-relaxed text-blue-800">
                Your privacy is important to us. This Privacy Policy explains how PartyGeng (“we,” “our,” or “the Platform”) collects, uses, stores, protects, and shares your personal information when you use our services. By accessing or using PartyGeng, you consent to the data practices described in this policy.
              </p>
            </div>

            <section id="info-collect" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
              <p className="mb-6">We collect the following categories of information to provide and improve our services:</p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Information You Provide Directly</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Account Information</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Full name</li>
                        <li>Username</li>
                        <li>Email address</li>
                        <li>Phone number</li>
                        <li>Password</li>
                        <li>Profile photo</li>
                        <li>Gender (optional)</li>
                        <li>Date of birth (optional)</li>
                        <li>Location or city</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Vendor Information</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Business name</li>
                        <li>CAC registration (if provided)</li>
                        <li>Means of identification</li>
                        <li>Service details</li>
                        <li>Pricing</li>
                        <li>Business address</li>
                        <li>Portfolio photos</li>
                        <li>Verification documents</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Event Information</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Event name</li>
                        <li>Event date and venue</li>
                        <li>Guest lists</li>
                        <li>Budgets</li>
                        <li>Photos and videos</li>
                        <li>Event categories and details</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Content You Upload</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Posts, photos, videos (max 10MB per file)</li>
                        <li>Reviews and ratings</li>
                        <li>Messages and comments</li>
                        <li>Profile descriptions</li>
                        <li>Galleries</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">Customer Support</h4>
                    <p className="text-sm">Information provided through live chat, email, or phone support.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Information We Collect Automatically</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Device & Technical Data</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>IP address</li>
                        <li>Device type</li>
                        <li>Browser type/version</li>
                        <li>Operating system</li>
                        <li>Session duration</li>
                        <li>App usage patterns</li>
                        <li>Crash logs</li>
                        <li>Referring URLs</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Usage & Activity</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Pages visited</li>
                        <li>Buttons clicked</li>
                        <li>Vendors viewed</li>
                        <li>Search queries</li>
                        <li>Time spent on features</li>
                        <li>Interaction with posts (likes, comments, shares)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                     <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Cookies & Tracking Technologies</h4>
                     <p>We use cookies to: Authenticate sessions, Save preferences, Improve performance, Analyze traffic, Provide personalized content.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Payment & Financial Information</h3>
                  <p className="mb-3">PartyGeng uses secure third-party payment processors.</p>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-red-50 p-5 rounded-xl border border-red-100">
                      <span className="text-red-600 font-bold block mb-2">We DO NOT store:</span>
                      <ul className="list-disc pl-5 space-y-1 text-red-800">
                        <li>Debit/credit card numbers</li>
                        <li>CVV</li>
                        <li>PIN</li>
                      </ul>
                    </div>
                    <div className="flex-1 bg-green-50 p-5 rounded-xl border border-green-100">
                      <span className="text-green-600 font-bold block mb-2">We may collect:</span>
                      <ul className="list-disc pl-5 space-y-1 text-green-800">
                        <li>Transaction history</li>
                        <li>Wallet balance</li>
                        <li>Payout information</li>
                        <li>Payment receipts</li>
                        <li>Bank details (voluntarily submitted for vendor withdrawals)</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 text-sm italic">All financial operations comply with national data protection and banking regulations.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1.4 Information from Third Parties</h3>
                  <p>We may receive information from: Identity verification companies, Payment gateways, Social login services (if enabled), Fraud prevention partners, Advertising partners.</p>
                </div>
              </div>
            </section>

            <section id="how-use" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h2>
              <p className="mb-6">We use collected data to provide, manage, and improve PartyGeng services:</p>
              
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">2.1 To Operate the Platform</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Create and manage accounts</li>
                        <li>Facilitate bookings</li>
                        <li>Process payments and payouts</li>
                        <li>Enable content posting and messaging</li>
                        <li>Provide vendor discovery features</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">2.2 To Improve User Experience</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Personalize recommendations</li>
                        <li>Customize feed content</li>
                        <li>Suggest vendors or event ideas</li>
                        <li>Enhance search results</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">2.3 For Safety & Enforcement</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Detect and prevent fraud</li>
                        <li>Monitor cyberbullying, harassment, explicit content</li>
                        <li>Enforce Terms of Service</li>
                        <li>Protect the community</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">2.4 Communication Purposes</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Send confirmations</li>
                        <li>Notify about bookings, cancellations, and updates</li>
                        <li>Respond to support requests</li>
                        <li>Send important security alerts</li>
                    </ul>
                </div>
                <div className="md:col-span-2">
                    <h3 className="font-bold text-gray-900 mb-2">2.5 Research & Analytics</h3>
                    <p>To analyse: Platform performance, User behaviour, Feature adoption, Market trends. This helps us optimize the platform and build better features.</p>
                </div>
              </div>
            </section>

            <section id="how-share" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. How We Share Your Information</h2>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                <p className="font-medium text-amber-900">We never sell your personal data. We may share your data ONLY with trusted third parties.</p>
              </div>

              <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">3.1 Vendors & Clients (Where Relevant)</h3>
                    <p>When interacting on the platform:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-2">
                        <li>Vendors see client event requests</li>
                        <li>Clients see vendor public profiles</li>
                        <li>Both may see names, photos, location, and necessary booking details</li>
                    </ul>
                    <p className="text-sm text-gray-500">Private data like phone numbers are only shared with your consent.</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">3.2 Third-Party Service Providers</h3>
                    <p>We work with external partners for: Payment processing, Identity verification, Cloud data storage, Analytics services, SMS/Email notifications, Fraud prevention. These partners follow strict confidentiality and data protection laws.</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">3.3 Legal Compliance</h3>
                    <p>We may disclose information if required by: Court orders, Government authorities, Law enforcement, Investigations. Especially in cases involving: Fraud, Cybercrime, Threats, Explicit content involving minors, Financial malpractice.</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-2">3.4 Business Transfers</h3>
                    <p>If PartyGeng undergoes: Acquisition, Merger, Investment, Restructuring. Your data may be transferred as part of business assets, but your privacy rights remain protected.</p>
                </div>
              </div>
            </section>

            <section id="how-protect" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">4. How We Protect Your Information</h2>
              <p className="mb-4">We use industry-standard security measures including:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {['Data encryption', 'Firewall protection', 'Two-Factor Authentication', 'Secure payment processing', 'Regular security audits', 'Access control and password hashing'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✔</div>
                        <span className="text-sm font-medium">{item}</span>
                    </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm">However, no online service is 100% secure. Users must also protect their passwords and devices.</p>
            </section>

            <section id="privacy-rights" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Your Privacy Rights</h2>
              <p className="mb-4">Depending on your region, you may have the right to:</p>
              <ul className="space-y-2 mb-4">
                {['Access your data', 'Update or correct information', 'Delete account', 'Request a copy of your data', 'Withdraw consent for some data uses', 'Report misuse or suspicious activity'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs">✔</div>
                        <span>{item}</span>
                    </li>
                ))}
              </ul>
              <p className="font-medium text-pink-600">Contact support for any of the above actions.</p>
            </section>

            <section id="data-retention" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Data Retention</h2>
              <p className="mb-4">We retain your information as long as your account is active.</p>
              <h4 className="font-bold text-gray-900 mb-2">After account deletion:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Some data (e.g., transaction history) may be stored for regulatory, security, and anti-fraud purposes.</li>
                <li>Posted content may remain visible if shared publicly (e.g., comments).</li>
                <li>Vendor’s completed transaction data remain for financial auditing.</li>
              </ul>
            </section>

            <section id="childrens-privacy" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Children’s Privacy</h2>
              <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-gray-900">
                <p className="font-bold text-gray-900">PartyGeng is NOT intended for anyone under 18 years of age.</p>
                <p className="mt-2">We do not knowingly collect data from minors. Any underage account will be suspended and removed immediately.</p>
              </div>
            </section>

            <section id="cookies" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Cookies & Tracking</h2>
              <p className="mb-2">PartyGeng uses:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Functional cookies', 'Analytical cookies', 'Session cookies', 'Preference cookies'].map((cookie) => (
                    <span key={cookie} className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">{cookie}</span>
                ))}
              </div>
              <p>You can modify browser settings to block cookies, but certain features may not function properly.</p>
            </section>

            <section id="international" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p>Data may be stored or processed outside your country (e.g., cloud servers). We ensure appropriate safeguards are in place to protect your information.</p>
            </section>

             <section id="social" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Social Features & Public Content</h2>
              <p className="mb-2">Anything you post publicly on: Trending feed, Vendor pages, Reviews, Event galleries, Comments… may be visible to other users or the general public.</p>
              <p className="font-medium text-pink-600">Please avoid sharing sensitive or personal information publicly.</p>
            </section>

            <section id="third-party" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Links</h2>
              <p>PartyGeng may contain links to third-party websites. We are not responsible for the privacy practices of such external sites.</p>
            </section>

            <section id="changes" className="scroll-mt-24 pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">We may update this Privacy Policy periodically. Continued use of the platform indicates acceptance of updated policies.</p>
              <p>Users may be notified through: Email, App notifications, Website announcement.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
