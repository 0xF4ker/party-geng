"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Mail, MessageCircle, AlertCircle } from "lucide-react";

const faqData = [
  {
    id: "general",
    category: "General Questions",
    items: [
      {
        question: "What is PartyGeng?",
        answer:
          "PartyGeng is an all-in-one event planning and social platform that helps users discover vendors, plan events, manage budgets, communicate securely, make payments, and share event moments within a vibrant community.",
      },
      {
        question: "Who can use PartyGeng?",
        answer: (
          <div className="space-y-2">
            <p>PartyGeng is open to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Individuals planning personal or corporate events</li>
              <li>Event vendors and service providers</li>
              <li>Businesses offering event-related services</li>
            </ul>
            <p>Users must be at least 18 years old to create an account.</p>
          </div>
        ),
      },
      {
        question: "Is PartyGeng free to use?",
        answer:
          "Yes. Creating an account and browsing vendors is free. Some services, such as vendor bookings, wallet transactions, and premium vendor features, may attract service fees.",
      },
    ],
  },
  {
    id: "account",
    category: "Account & Profile",
    items: [
      {
        question: "How do I create an account?",
        answer: (
          <div className="space-y-2">
            <p>You can sign up using:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email</li>
              <li>Google sign-in (for personal accounts)</li>
            </ul>
            <p>Vendors are required to complete additional verification before going live.</p>
          </div>
        ),
      },
      {
        question: "Can I have both a personal and vendor account?",
        answer:
          "Yes. You may switch between account types, but each account must meet its specific verification requirements.",
      },
      {
        question: "How do I verify my account?",
        answer: (
          <div className="space-y-2">
            <p>Verification may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email confirmation</li>
              <li>Phone number verification</li>
              <li>Identity or business documentation (for vendors)</li>
            </ul>
            <p>Verified accounts enjoy increased trust and platform privileges.</p>
          </div>
        ),
      },
      {
        question: "Can I change profile details?",
        answer:
          "Yes. Most profile details can be updated from your Profile Settings page. Some information, such as verified business details, may require support approval.",
      },
    ],
  },
  {
    id: "planning",
    category: "Event Planning",
    items: [
      {
        question: "How do I create an event?",
        answer:
          'Go to your my event page, click "Create Event", enter your event details, and start adding vendors, guests, and tasks.',
      },
      {
        question: "Can I manage multiple events at once?",
        answer:
          "Yes. PartyGeng allows you to create and manage multiple events simultaneously.",
      },
      {
        question: "What planning tools are available?",
        answer: (
          <div className="space-y-2">
            <p>PartyGeng offers:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Budget tracking</li>
              <li>Vendor management</li>
              <li>Guest list & RSVP tracking</li>
              <li>To-do lists with reminders</li>
              <li>Event galleries</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "vendors",
    category: "Vendors & Bookings",
    items: [
      {
        question: "How do I find vendors?",
        answer: (
          <div className="space-y-2">
            <p>Use the Vendors Page to search by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Category</li>
              <li>Location</li>
              <li>Rating</li>
              <li>Availability</li>
            </ul>
          </div>
        ),
      },
      {
        question: "How do vendor bookings work?",
        answer: (
          <ol className="list-decimal pl-5 space-y-1">
            <li>Select a vendor</li>
            <li>Engage the vendor in a chat and request for service quote</li>
            <li>Accept or decline quote</li>
            <li>If accepted, send an invite to vendor to be added to your moodboard for collective planning with other vendors on the event.</li>
            <li>Payment is completed via PartyGeng Wallet</li>
          </ol>
        ),
      },
      {
        question: "Are vendors verified?",
        answer:
          "Yes. Vendors must submit identity and business documents before being listed. However, PartyGeng does not guarantee service quality and encourages users to review ratings and reviews.",
      },
      {
        question: "Can I favorite vendors?",
        answer: "Yes. You can save vendors to your favorite for quick access later.",
      },
    ],
  },
  {
    id: "messaging",
    category: "Messaging & Social Features",
    items: [
      {
        question: "Does PartyGeng have in-app messaging?",
        answer:
          "Yes. PartyGeng provides secure in-app messaging between users and vendors.",
      },
      {
        question: "Can I share photos and videos?",
        answer: (
          <div className="space-y-2">
            <p>Yes, but uploaded content must:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Not exceed 10MB per file</li>
              <li>Follow community guidelines</li>
              <li>Avoid explicit or harmful content</li>
            </ul>
          </div>
        ),
      },
      {
        question: "What is the Trending page?",
        answer:
          "The Trending page is a curated social feed featuring event moments, inspiration, and vendor showcases using a masonry-style layout.",
      },
    ],
  },
  {
    id: "wallet",
    category: "Wallet & Payments",
    items: [
      {
        question: "What is the PartyGeng Wallet?",
        answer: (
          <div className="space-y-2">
            <p>The PartyGeng Wallet allows users to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Add funds</li>
              <li>Transfer funds</li>
              <li>Receive payments</li>
              <li>Fund savings</li>
              <li>Track transactions</li>
              <li>Request refunds</li>
            </ul>
          </div>
        ),
      },
      {
        question: "Are payments secure?",
        answer:
          "Yes. All transactions are encrypted and processed through trusted payment providers.",
      },
      {
        question: "Can I withdraw funds from my wallet?",
        answer: "Yes, subject to verification and withdrawal limits.",
      },
      {
        question: "Are there transaction fees?",
        answer:
          "Yes. Certain transactions may include service or processing fees, which are clearly displayed before confirmation.",
      },
    ],
  },
  {
    id: "refunds",
    category: "Refunds & Disputes",
    items: [
      {
        question: "How do refunds work?",
        answer: (
          <div className="space-y-2">
            <p>Refunds depend on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vendor refund policy</li>
              <li>Time of cancellation</li>
              <li>Evidence provided</li>
            </ul>
            <p>All refund requests are handled through the Resolution Centre.</p>
          </div>
        ),
      },
      {
        question: "What is the Resolution Centre?",
        answer: (
          <div className="space-y-2">
            <p>The Resolution Centre helps users resolve:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payment disputes</li>
              <li>Vendor no-shows</li>
              <li>Fraud or unauthorized transactions</li>
              <li>Service quality complaints</li>
            </ul>
          </div>
        ),
      },
      {
        question: "How long does dispute resolution take?",
        answer:
          "Most cases are resolved within 7–14 business days, depending on complexity.",
      },
    ],
  },
  {
    id: "safety",
    category: "Safety, Content & Community",
    items: [
      {
        question: "What content is not allowed?",
        answer: (
          <div className="space-y-2">
            <p>The following are strictly prohibited:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Explicit sexual content</li>
              <li>Promotion of illegal activities</li>
              <li>Cyberbullying or harassment</li>
              <li>Fraudulent or misleading information</li>
              <li>Hate speech or violence</li>
              <li>Explicit party or unsafe event promotions</li>
            </ul>
          </div>
        ),
      },
      {
        question: "What happens if I violate the rules?",
        answer: (
          <div className="space-y-2">
            <p>Penalties may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Content removal</li>
              <li>Temporary account suspension</li>
              <li>Permanent account ban</li>
              <li>Wallet restrictions</li>
            </ul>
          </div>
        ),
      },
      {
        question: "How do I report a user or vendor?",
        answer: (
          <div className="space-y-2">
            <p>You can report directly from:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>User profiles</li>
              <li>Messages</li>
              <li>Posts</li>
              <li>Resolution Centre</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "support",
    category: "Technical & Support",
    items: [
      {
        question: "Why isn’t my transaction showing?",
        answer:
          "Pending transactions may take a few minutes to several hours depending on your payment method. If delayed, contact support.",
      },
      {
        question: "What devices does PartyGeng support?",
        answer: (
          <div className="space-y-2">
            <p>PartyGeng is optimized for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mobile devices</li>
              <li>Tablets</li>
              <li>Desktop browsers</li>
            </ul>
          </div>
        ),
      },
      {
        question: "How do I contact support?",
        answer: (
          <div className="space-y-2">
            <p>You can reach us via:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In-app support chat</li>
              <li>Resolution Centre</li>
              <li>Email: support@partygeng.com</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "legal",
    category: "Legal & Policies",
    items: [
      {
        question: "Does PartyGeng store my personal data?",
        answer:
          "Yes, but only in accordance with our Privacy Policy. Your data is never sold to third parties without consent.",
      },
      {
        question: "Where can I read PartyGeng policies?",
        answer: (
          <div className="space-y-2">
            <p>You can find all policies on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><Link href="/terms-of-service" className="text-pink-600 hover:underline">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-pink-600 hover:underline">Privacy Policy</Link></li>
              <li>Refund Policy</li>
              <li>Community Guidelines</li>
            </ul>
          </div>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -35% 0px" }
    );

    faqData.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveCategory(id);
    }
  };

  const filteredFAQs = faqData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof item.answer === "string" &&
            item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-pink-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Everything you need to know about PartyGeng.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm shadow-sm"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation - Hidden on mobile/tablet */}
        <aside className="hidden lg:block w-1/4 min-w-[250px] shrink-0">
          <div className="sticky top-24 space-y-1">
            <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">
              Categories
            </h3>
            <nav className="flex flex-col space-y-1 border-l-2 border-gray-100">
              {faqData.map(({ id, category }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={cn(
                    "text-left py-2 px-4 text-sm font-medium transition-all hover:text-pink-600 border-l-2 -ml-[2px]",
                    activeCategory === id
                      ? "border-pink-600 text-pink-600 bg-pink-50/50"
                      : "border-transparent text-gray-500"
                  )}
                >
                  {category}
                </button>
              ))}
            </nav>

             <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-pink-600" />
                    Still have questions?
                </h4>
                <p className="text-sm text-gray-600 mb-4">Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.</p>
                <Link 
                    href="/help-and-support" 
                    className="block w-full text-center py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Get in touch
                </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto lg:mx-0">
          <div className="space-y-16">
            {filteredFAQs.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                  {section.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, index) => (
                    <AccordionItem key={index} value={`${section.id}-${index}`}>
                      <AccordionTrigger className="text-left text-base font-semibold text-gray-800 hover:text-pink-600 hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed text-base pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}

            {filteredFAQs.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                    <p className="text-gray-500 mt-1">
                        We couldn&apos;t find any FAQs matching &quot;{searchQuery}&quot;.
                    </p>
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-pink-600 font-medium hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            )}
          </div>

          {/* Mobile "Still have questions?" Card */}
          <div className="mt-16 lg:hidden bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 mb-4">
                <Mail className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-6">Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.</p>
            <Link 
                href="/help-and-support" 
                className="inline-block py-3 px-6 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm"
            >
                Get in touch
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
