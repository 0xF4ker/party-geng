"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";

const sections = [
  { id: "definitions", title: "1. Definitions" },
  { id: "acceptance", title: "2. Acceptance of Terms" },
  { id: "account", title: "3. Account Creation & Security" },
  { id: "services", title: "4. Platform Services" },
  { id: "responsibilities", title: "5. User Responsibilities" },
  { id: "relationships", title: "6. Client–Vendor Relationship" },
  { id: "financial", title: "7. Payments & Financial Terms" },
  { id: "content", title: "8. Content Rules & Ownership" },
  { id: "prohibited", title: "9. Prohibited Activities & Penalties" },
  { id: "reviews", title: "10. Reviews & Ratings Policy" },
  { id: "safety", title: "11. Event Safety & Responsibility" },
  { id: "suspension", title: "12. Suspension or Termination" },
  { id: "privacy", title: "13. Privacy & Data Usage" },
  { id: "updates", title: "14. Updates to Terms" },
  { id: "disputes", title: "15. Dispute Resolution" },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("");
  const { headerHeight } = useUiStore();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -35% 0px" },
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
    <div className="min-h-screen bg-white" style={{ paddingTop: headerHeight }}>
      {/* Header */}
      <div className="bg-pink-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl">
            <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 md:text-xl">
              Welcome to PartyGeng. Please read these terms carefully before
              using our platform.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex flex-col gap-12 px-4 py-12 md:px-6 lg:flex-row">
        {/* Table of Contents - Sticky Sidebar */}
        <aside className="hidden w-1/4 min-w-[250px] shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">
              Contents
            </h3>
            <nav className="flex flex-col space-y-1 border-l-2 border-gray-100">
              {sections.map(({ id, title }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={cn(
                    "-ml-0.5 border-l-2 px-4 py-2 text-left text-sm font-medium transition-all hover:text-pink-600",
                    activeSection === id
                      ? "border-pink-600 bg-pink-50/50 text-pink-600"
                      : "border-transparent text-gray-500",
                  )}
                >
                  {title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl flex-1 lg:mx-0">
          <div className="prose prose-pink prose-lg max-w-none space-y-12 text-gray-600">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm leading-relaxed text-blue-800 md:text-base">
                Welcome to PartyGeng, a platform designed to help users plan
                events, hire vendors, discover services, create content, and
                connect with a vibrant event-driven community. By accessing or
                using PartyGeng (“the Platform,” “we,” “us,” or “our”), you
                agree to the following Terms of Service. These terms apply to
                all users, including clients, vendors, creators, guests, and
                visitors. If you do not agree, please discontinue using the
                platform.
              </p>
            </div>

            <section id="definitions" className="scroll-mt-24">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                1. Definitions
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Client / User:</strong> Anyone who creates an account
                  to book services, create events, or use the platform.
                </li>
                <li>
                  <strong>Vendor:</strong> A business or individual offering
                  event-related services or products.
                </li>
                <li>
                  <strong>Service(s):</strong> Any product or activity provided
                  by vendors or by PartyGeng.
                </li>
                <li>
                  <strong>Content:</strong> Any text, photo, video, review,
                  event post, message, or media uploaded by users.
                </li>
                <li>
                  <strong>Wallet:</strong> The PartyGeng in-app financial wallet
                  used for transactions.
                </li>
                <li>
                  <strong>Event:</strong> Any party, celebration, gathering,
                  hire, or booking created or managed on the platform.
                </li>
              </ul>
            </section>

            <section
              id="acceptance"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                2. Acceptance of Terms
              </h2>
              <p className="mb-4">By using PartyGeng, you confirm that:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>You are at least 18 years old.</li>
                <li>All information you provide is accurate and truthful.</li>
                <li>
                  You agree to comply with all Nigerian laws and any other
                  applicable international digital laws.
                </li>
              </ul>
            </section>

            <section
              id="account"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                3. Account Creation and Security
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Users must register with valid information (name, phone
                  number, email, etc.).
                </li>
                <li>
                  You are fully responsible for safeguarding your login
                  credentials.
                </li>
                <li>
                  Impersonation, fake accounts, or using another person&apos;s
                  identity is prohibited.
                </li>
                <li>
                  PartyGeng reserves the right to verify vendor identities and
                  client accounts.
                </li>
              </ul>
            </section>

            <section
              id="services"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                4. Platform Services
              </h2>
              <p className="mb-6">
                PartyGeng provides tools and features including:
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-6">
                  <h4 className="mb-2 font-bold text-gray-900">
                    Event Planning Tools
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Budgeting</li>
                    <li>Guest listing</li>
                    <li>To-do lists</li>
                    <li>Wishlist</li>
                    <li>Moodboard</li>
                    <li>Event hosting pages</li>
                    <li>Vendor discovery</li>
                    <li>Gallery, reviews, messaging</li>
                    <li>Event creation and sharing</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-gray-50 p-6">
                  <h4 className="mb-2 font-bold text-gray-900">
                    Vendor Marketplace
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Vendor profiles</li>
                    <li>Booking systems</li>
                    <li>Order management</li>
                    <li>Ratings and reviews</li>
                    <li>Wallet payout management</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-gray-50 p-6">
                  <h4 className="mb-2 font-bold text-gray-900">
                    Social & Content Features
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Trending feed</li>
                    <li>Posts, photos, videos</li>
                    <li>Likes, comments, shares</li>
                    <li>Messaging and notifications</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-gray-50 p-6">
                  <h4 className="mb-2 font-bold text-gray-900">
                    In-App Wallet & Payment Services
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Deposits</li>
                    <li>Withdrawals</li>
                    <li>Payouts</li>
                    <li>iSave</li>
                    <li>Escrow-style booking protection</li>
                    <li>Receipts and payment tracking</li>
                    <li>Resolution Centre</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                PartyGeng may update or discontinue any feature without prior
                notice.
              </p>
            </section>

            <section
              id="responsibilities"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                5. User Responsibilities
              </h2>
              <p className="mb-4">Users agree NOT to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Provide false, misleading, or incomplete information.</li>
                <li>Post harmful, illegal, or restricted content.</li>
                <li>
                  Exploit platform vulnerabilities or manipulate the system.
                </li>
                <li>Harass, threaten, or defraud any user or vendor.</li>
                <li>
                  Upload files larger than 10 MB (maximum allowed media size).
                </li>
                <li>
                  Circumvent PartyGeng Payment System (off-platform payments).
                </li>
                <li>Create duplicate accounts for malicious reasons.</li>
              </ul>
              <p className="mt-4 font-medium text-pink-600">
                PartyGeng may suspend or terminate accounts that violate rules.
              </p>
            </section>

            <section
              id="relationships"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                6. Client–Vendor Relationship
              </h2>
              <p className="mb-4">
                PartyGeng is not a party in the agreement between client and
                vendor.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-bold text-gray-900">
                    Vendors Are Responsible For:
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Delivering services as described</li>
                    <li>Being punctual, professional, and reliable</li>
                    <li>Providing accurate pricing</li>
                    <li>Handling disputes directly with clients</li>
                    <li>Uploading truthful images and descriptions</li>
                    <li>Leaving clear reviews</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-gray-900">
                    Clients Are Responsible For:
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Providing accurate event details</li>
                    <li>Paying agreed amounts</li>
                    <li>Communicating clearly with vendors</li>
                    <li>Leaving fair reviews</li>
                    <li>Respecting vendor time and property</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-gray-900">
                    PartyGeng is Responsible For:
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Providing a safe platform for bookings</li>
                    <li>Facilitating secure payments</li>
                    <li>Offering dispute mediation when necessary</li>
                  </ul>
                </div>
              </div>
            </section>

            <section
              id="financial"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                7. Payments & Financial Terms
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    7.1 Wallet Usage
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>
                      All payments must be made through the PartyGeng platform.
                    </li>
                    <li>
                      Funds may be deposited via approved payment channels.
                    </li>
                    <li>
                      PartyGeng will not be responsible and/or acknowledge
                      dispute on transactions made outside the in-app wallet.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    7.2 Vendor Payouts
                  </h3>
                  <p className="mb-2 text-sm">Payouts are processed after:</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Job completion</li>
                    <li>No dispute filed</li>
                    <li>Client confirmation</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-500">
                    Processing time may vary (typically 24–48 hours).
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    7.3 Fees and Commissions
                  </h3>
                  <p className="text-sm">
                    PartyGeng may charge transaction charges, vendor
                    commissions, and processing fees. All fees will be disclosed
                    transparently in the app.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    7.4 Refund Policy
                  </h3>
                  <p className="mb-2 text-sm font-semibold">
                    Refunds may be issued when:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>A vendor cancels</li>
                    <li>A client proves non-delivery</li>
                    <li>PartyGeng confirms service failure</li>
                  </ul>
                  <p className="mt-2 mb-2 text-sm font-semibold">
                    Non-refundable items include:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Completed bookings</li>
                    <li>Digital products already accessed</li>
                    <li>Convenience fees</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    7.5 Chargebacks
                  </h3>
                  <p className="text-sm">
                    Fraudulent chargebacks will result in account suspension,
                    debt recovery actions, and legal reporting.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="content"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                8. Content Rules & Ownership
              </h2>
              <p className="mb-4">
                Content uploaded to PartyGeng users must be respectful,
                non-explicit, non-violent, free of hate speech, and suitable for
                a general audience.
              </p>
              <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-6">
                <h4 className="mb-2 font-bold text-red-900">
                  PROHIBITED CONTENT:
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-800">
                  <li>Pornographic content</li>
                  <li>Nudity or sexual acts</li>
                  <li>
                    Explicit party footage (stripper parties, adult shows,
                    illicit drug use)
                  </li>
                  <li>Child exploitation</li>
                  <li>Excessive violence</li>
                  <li>Fraudulent claims</li>
                  <li>Scams or misleading offers</li>
                  <li>Copyrighted materials without permission</li>
                </ul>
              </div>
              <div className="mt-6">
                <h4 className="mb-2 font-bold text-gray-900">
                  Content Restrictions:
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>Max upload size: 10MB per file</li>
                  <li>Video upload not more than 10 seconds</li>
                  <li>No harmful links (malware, phishing, fake sites)</li>
                  <li>No spamming</li>
                </ul>
                <p className="mt-4 text-sm text-gray-500">
                  By uploading content, you grant PartyGeng a license to display
                  it on the platform.
                </p>
              </div>
            </section>

            <section
              id="prohibited"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                9. Prohibited Activities & Penalties
              </h2>
              <p className="mb-6">
                Below are actions that may result in warnings, suspensions,
                account termination, or legal action:
              </p>
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Fraudulent Activity
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Faking transactions, Fake reviews, Providing false
                    services, Identity theft, Scam bookings, Off-platform
                    payments to avoid fees.
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    Penalty: Permanent ban + legal action.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Cyberbullying, Harassment & Hate Speech
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Threats, Extortion, Insulting reviews, Harassing
                    messages.
                  </p>
                  <p className="text-sm font-semibold text-orange-600">
                    Penalty: Warning → Suspension → Ban.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Explicit Content or Adult Parties
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Uploading nudity, Hiring adult workers through the
                    platform, Posting sexually suggestive videos/photos.
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    Penalty: Immediate removal + possible ban.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Violent, Illegal, or Dangerous Parties
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Drug-use videos, Weaponized events, Underage
                    drinking posts.
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    Penalty: Immediate suspension + authority notification.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Vendor or Client Abuse
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Vendors not showing up, Clients refusing
                    legitimate payment, Last-minute cancellations intended to
                    harm.
                  </p>
                  <p className="text-sm font-semibold text-orange-600">
                    Penalty: Account restrictions + fines.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 font-bold text-gray-900">
                    🚫 Technological Misuse
                  </h3>
                  <p className="mb-2 text-sm">
                    Includes: Scraping the platform, Hacking attempts, Using
                    bots or automation.
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    Penalty: Instant ban + IP blacklisting.
                  </p>
                </div>
              </div>
            </section>

            <section
              id="reviews"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                10. Reviews & Ratings Policy
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>Users must provide honest, fair, and factual reviews.</li>
                <li>
                  Fake, manipulated, or malicious reviews will be removed.
                </li>
                <li>Repeated offenses may lead to account penalties.</li>
              </ul>
            </section>

            <section
              id="safety"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                11. Event Safety & Responsibility
              </h2>
              <p className="mb-4">PartyGeng is not responsible for:</p>
              <ul className="mb-4 list-disc space-y-1 pl-5">
                <li>Damages or injuries during events</li>
                <li>Vendor misconduct</li>
                <li>Client misconduct</li>
                <li>Loss of property</li>
              </ul>
              <p>
                Users are responsible for ensuring safety, legality, and
                compliance during events.
              </p>
            </section>

            <section
              id="suspension"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                12. Suspension or Termination
              </h2>
              <p>
                PartyGeng may suspend, restrict, or delete accounts that violate
                these terms. We may also remove harmful or inappropriate content
                without notice.
              </p>
            </section>

            <section
              id="privacy"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                13. Privacy & Data Usage
              </h2>
              <p>
                PartyGeng collects and processes user data according to our
                Privacy Policy. We do not sell personal data to third parties.
              </p>
            </section>

            <section
              id="updates"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                14. Updates to Terms
              </h2>
              <p>
                PartyGeng may update these Terms of Service at any time.
                Continued use of the platform means you accept the updated
                terms.
              </p>
            </section>

            <section
              id="disputes"
              className="scroll-mt-24 border-t border-gray-100 pt-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                15. Dispute Resolution
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Clients and vendors should attempt to resolve issues directly.
                </li>
                <li>If a dispute escalates, PartyGeng may mediate.</li>
                <li>PartyGeng’s decision on escalated disputes is final.</li>
                <li>
                  Legal disputes must follow Nigerian digital commerce laws.
                </li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
