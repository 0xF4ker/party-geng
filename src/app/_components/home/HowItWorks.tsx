"use client";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Lock,
  CheckCircle,
  Search,
  Star,
  Send,
  MapPin,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

const cn = (...inputs: (string | boolean | undefined | null)[]) =>
  inputs.filter(Boolean).join(" ");

/* ──────────────────────────────────────────────
   Phone mockup — animates through 4 steps
────────────────────────────────────────────── */
const AnimatedStepIllustration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  useEffect(() => {
    const t = setTimeout(
      () => setCurrentStep((s) => (s % 4) + 1),
      3000,
    );
    return () => clearTimeout(t);
  }, [currentStep]);

  return (
    <>
      <style>{`
        .pg-phone-screen {
          position: absolute; inset: 0;
          padding: 1.5rem 1rem;
          background-color: #f9fafb;
          border-radius: inherit;
          transition: opacity 0.7s ease-in-out;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        @keyframes pg-card-slide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pg-vendor-card { opacity: 0; animation: pg-card-slide 0.4s ease-out forwards; }
        .pg-vendor-card:nth-child(1) { animation-delay: 0.1s; }
        .pg-vendor-card:nth-child(2) { animation-delay: 0.25s; }
        @keyframes pg-bubble-in {
          from { opacity: 0; transform: scale(0.8) translateY(5px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pg-chat-bubble { opacity: 0; animation: pg-bubble-in 0.3s ease-out forwards; }
        .pg-chat-bubble:nth-child(1) { animation-delay: 0.2s; }
        .pg-chat-bubble:nth-child(2) { animation-delay: 0.5s; }
        @keyframes pg-pay-success {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .pg-pay-anim { opacity: 0; animation: pg-pay-success 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        @keyframes pg-success-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .pg-success-anim { opacity: 0; animation: pg-success-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        .pg-scrollbar-hide::-webkit-scrollbar { display: none; }
        .pg-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Phone shell — silver frame */}
      <div
        style={{
          position: "relative",
          margin: "0 auto",
          width: 270,
          height: 550,
          borderRadius: "2.5rem",
          border: "10px solid #e5e7eb",
          background: "#e5e7eb",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* Notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 140, height: 18, background: "#e5e7eb", borderRadius: "0 0 1rem 1rem" }} />
        {/* Side buttons */}
        <div style={{ position: "absolute", top: 72, left: -13, width: 3, height: 32, background: "#e5e7eb", borderRadius: "4px 0 0 4px" }} />
        <div style={{ position: "absolute", top: 124, left: -13, width: 3, height: 46, background: "#e5e7eb", borderRadius: "4px 0 0 4px" }} />
        <div style={{ position: "absolute", top: 142, right: -13, width: 3, height: 46, background: "#e5e7eb", borderRadius: "0 4px 4px 0" }} />

        <div style={{ height: "100%", width: "100%", overflow: "hidden", borderRadius: "2rem", background: "#fff" }}>
          <div style={{ position: "relative", height: "100%", width: "100%" }}>

            {/* Step 1: Find Vendor */}
            <div className="pg-phone-screen" style={{ opacity: currentStep === 1 ? 1 : 0, pointerEvents: currentStep === 1 ? "auto" : "none" }}>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input type="text" placeholder="Search vendors (e.g., DJ)" readOnly
                  style={{ width: "100%", borderRadius: 9999, border: "1px solid #d1d5db", background: "#f3f4f6", padding: "8px 36px 8px 16px", fontSize: 13, outline: "none" }} />
                <Search style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", width: 14, height: 14, color: "#9ca3af" }} />
              </div>
              <div className="pg-scrollbar-hide" style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "DJ SpinMaster", color: "#f72585", abbr: "DJ", city: "Lagos", rating: "4.9" },
                  { label: "Pixel Perfect Pics", color: "#7209b7", abbr: "Cam", city: "Abuja", rating: "5.0" },
                ].map((v) => (
                  <div key={v.label} className={cn("pg-vendor-card", currentStep === 1 ? "animate" : "")}
                    style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <Image src={`https://placehold.co/60x60/${v.color.slice(1)}/ffffff?text=${v.abbr}`} alt={v.label} width={40} height={40} style={{ borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{v.label}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MapPin style={{ width: 11, height: 11, color: "#9ca3af" }} />
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{v.city}</span>
                        <Star style={{ width: 11, height: 11, color: "#facc15", fill: "#facc15", marginLeft: 4 }} />
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{v.rating}</span>
                      </div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "#d1d5db", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Get Quote */}
            <div className="pg-phone-screen" style={{ opacity: currentStep === 2 ? 1 : 0, pointerEvents: currentStep === 2 ? "auto" : "none" }}>
              <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Today, 10:30 AM</p>
              <div className="pg-scrollbar-hide" style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                <div className={cn("pg-chat-bubble", currentStep === 2 ? "animate" : "")} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <p style={{ maxWidth: "75%", borderRadius: "12px 12px 2px 12px", background: "#f72585", padding: "10px 12px", fontSize: 12, color: "#fff", margin: 0 }}>
                    Hi! Need a DJ for my birthday on Nov 15th. Are you available?
                  </p>
                </div>
                <div className={cn("pg-chat-bubble", currentStep === 2 ? "animate" : "")} style={{ display: "flex", justifyContent: "flex-start" }}>
                  <p style={{ maxWidth: "75%", borderRadius: "12px 12px 12px 2px", background: "#f3f4f6", padding: "10px 12px", fontSize: 12, color: "#1f2937", margin: 0 }}>
                    Hey! Yes, I&apos;m available. My rate is ₦XXX for 4 hours. Sending the official quote now. 👍
                  </p>
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
                <input type="text" readOnly placeholder="Type your message..." style={{ flexGrow: 1, borderRadius: 9999, border: "1px solid #d1d5db", background: "#f3f4f6", padding: "6px 12px", fontSize: 12, outline: "none" }} />
                <button style={{ borderRadius: "50%", background: "#f72585", padding: 6, border: "none", display: "flex", cursor: "pointer" }}>
                  <Send style={{ width: 14, height: 14, color: "#fff" }} />
                </button>
              </div>
            </div>

            {/* Step 3: Pay Securely */}
            <div className="pg-phone-screen" style={{ opacity: currentStep === 3 ? 1 : 0, pointerEvents: currentStep === 3 ? "auto" : "none", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div className={cn("pg-pay-anim", currentStep === 3 ? "animate" : "")} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: 16, borderRadius: "50%", background: "#ede9fe", padding: 16 }}>
                  <Lock style={{ width: 48, height: 48, color: "#7c3aed" }} strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#1f2937", margin: 0 }}>Payment Secured</p>
                <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>₦XXX has been held securely.<br />Funds release after the gig.</p>
                <button style={{ marginTop: 20, borderRadius: 9999, background: "#7c3aed", padding: "8px 20px", fontSize: 12, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}>
                  View Booking
                </button>
              </div>
            </div>

            {/* Step 4: Event Success */}
            <div className="pg-phone-screen" style={{ opacity: currentStep === 4 ? 1 : 0, pointerEvents: currentStep === 4 ? "auto" : "none", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div className={cn("pg-success-anim", currentStep === 4 ? "animate" : "")} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: 16, borderRadius: "50%", background: "#dcfce7", padding: 16 }}>
                  <CheckCircle style={{ width: 48, height: 48, color: "#16a34a" }} strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#1f2937", margin: 0 }}>Event Success!</p>
                <p style={{ marginTop: 6, marginBottom: 12, fontSize: 12, color: "#6b7280" }}>Payment released to DJ SpinMaster.</p>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map((s) => <Star key={s} style={{ width: 18, height: 18, fill: "#facc15", color: "#facc15" }} />)}
                </div>
                <button style={{ borderRadius: 9999, background: "#1c1c28", padding: "8px 20px", fontSize: 12, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}>
                  Leave a Review
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────
   HowItWorks section
────────────────────────────────────────────── */
const STEPS = [
  {
    icon: Search,
    title: "Find Vendor",
    description: "Search or browse categories to find the perfect verified vendor.",
    glowColor: "#f72585",
  },
  {
    icon: MessageSquare,
    title: "Get Quote",
    description: "Chat directly with vendors and receive an in-app quote.",
    glowColor: "#7209b7",
  },
  {
    icon: Lock,
    title: "Pay Securely",
    description: "Book your vendor by paying securely. We hold the funds.",
    glowColor: "#b5179e",
  },
  {
    icon: CheckCircle,
    title: "Event Success!",
    description: "Enjoy your event! Payment is released and you leave a review.",
    glowColor: "#ffbe0b",
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 4), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="landing"
      style={{ background: "#f9fafb", padding: "96px 0" }}
    >
      <div className="container mx-auto px-4">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 64,
            alignItems: "center",
          }}
          className="lg:grid-cols-2"
        >

          {/* Left: text + steps */}
          <div>
            <div className="l-section-tag">Platform Overview</div>
            <h2
              style={{
                color: "var(--l-text)",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              A fully integrated platform for your events
            </h2>
            <p style={{ color: "var(--l-text-muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 480, marginBottom: 48 }}>
              From finding the perfect vendor to secure payments and post-event
              reviews — everything in one place.
            </p>

            {/* Steps — vertical list on desktop */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                return (
                  <button
                    key={step.title}
                    onClick={() => setActiveStep(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      borderRadius: 14,
                      border: "1px solid",
                      borderColor: isActive ? `${step.glowColor}55` : "rgba(0,0,0,0.06)",
                      background: isActive ? `${step.glowColor}10` : "transparent",
                      opacity: isActive ? 1 : 0.6,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.3s ease",
                      boxShadow: isActive ? `0 0 20px ${step.glowColor}18` : "none",
                    }}
                  >
                    {/* Icon orb */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: isActive ? `${step.glowColor}15` : "rgba(0,0,0,0.02)",
                        border: `1px solid ${isActive ? `${step.glowColor}55` : "rgba(0,0,0,0.1)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: isActive ? `0 0 16px ${step.glowColor}40` : "none",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Icon
                        style={{
                          width: 22,
                          height: 22,
                          color: isActive ? step.glowColor : "var(--l-text-muted)",
                          transition: "color 0.3s ease",
                        }}
                      />
                    </div>
                    <div>
                      <p style={{ color: isActive ? "var(--l-text)" : "var(--l-text-muted)", fontWeight: 700, fontSize: 15, margin: 0, transition: "color 0.3s ease" }}>
                        {step.title}
                      </p>
                      <p style={{ color: "var(--l-text-muted)", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>
                        {step.description}
                      </p>
                    </div>
                    {/* Step number */}
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: isActive ? step.glowColor : "rgba(0,0,0,0.15)", flexShrink: 0 }}>
                      0{i + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Neon connector line */}
            <div className="l-neon-line" style={{ marginTop: 24 }} />
          </div>

          {/* Right: phone mockup */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ height: 600, width: "100%", maxWidth: 400 }}>
              <AnimatedStepIllustration />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
