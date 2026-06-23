"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaPluginType } from "embla-carousel";
import LoginJoinComponent from "../LoginJoinComponent";

/* ── Hero slide images for the floating card stack ── */
const STACK_IMAGES = [
  {
    id: 1,
    src: "/event-assets/ee4dcf92-748c-4995-839d-f00d502abc31.jpg",
    alt: "Dream Weddings",
    label: "Dream Weddings",
    sub: "Venues · Decor · Planning",
  },
  {
    id: 2,
    src: "/event-assets/a9b65768-b894-44db-bb63-332a631fdebe.jpg",
    alt: "Private Parties",
    label: "Private Parties",
    sub: "Intimate Celebrations",
  },
  {
    id: 3,
    src: "/event-assets/e1599dd5-b393-4698-96b1-da811cc17065.jpg",
    alt: "Live Entertainment",
    label: "Live Entertainment",
    sub: "DJs · Bands · Sound",
  },
];

/* ── Ticker categories ── */
const TICKER_ITEMS = [
  "🎵 Music & DJs",
  "📷 Photography",
  "🍽️ Catering",
  "🎪 Decor & Design",
  "🎭 Entertainment",
  "🚗 Transportation",
  "💃 Personal Style",
  "🎤 Event Staffing",
  "🏛️ Event Venues",
  "🎬 Media",
  "⚙️ Equipment Rental",
  "📋 Planning",
];

/* ── Modal wrapper ── */
const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  useEffect(() => {
    const orig = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative h-full w-full sm:h-auto sm:w-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

/* ── Word-rise stagger headline ── */
const HEADLINE_LINES = [
  ["The", "Ultimate", "Hub", "for"],
  ["Event", "Experiences"],
];

const AnimatedHeadline = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  let wordIndex = 0;
  return (
    <h1
      style={{ fontFamily: "'Clash Display', 'Quicksand', sans-serif" }}
      className="text-5xl font-bold leading-tight text-[var(--l-text)] sm:text-6xl md:text-7xl"
    >
      {HEADLINE_LINES.map((line, li) => (
        <span key={li} className="block">
          {line.map((word) => {
            const delay = wordIndex++ * 0.1;
            const isAccent = word === "Event" || word === "Experiences";
            return (
              <span key={word} className="l-word-clip mr-[0.25em] last:mr-0">
                <span
                  className="l-word"
                  style={
                    visible
                      ? {
                          animation: `word-rise 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
                        }
                      : undefined
                  }
                >
                  {isAccent ? (
                    <span
                      style={{
                        background: "linear-gradient(90deg, #f72585, #b5179e)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {word}
                    </span>
                  ) : (
                    word
                  )}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
};

/* ── Floating image card stack ── */
const CARD_CONFIGS = [
  { rot: "-7deg", z: 1, yOffset: "24px", xOffset: "-16px", floatDelay: "0s" },
  { rot: "3deg",  z: 3, yOffset: "0px",  xOffset: "16px",  floatDelay: "0.8s" },
  { rot: "12deg", z: 2, yOffset: "32px", xOffset: "48px",  floatDelay: "1.6s" },
];

const FloatingCardStack = () => {
  const [autoplayPlugin] = useState(() => {
    const AP = Autoplay as unknown as (opts?: {
      delay?: number;
      stopOnInteraction?: boolean;
      stopOnMouseEnter?: boolean;
    }) => EmblaPluginType;
    return AP({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true });
  });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      {/* Card stack — desktop */}
      <div className="relative hidden h-[440px] lg:block">
        {STACK_IMAGES.map((img, i) => {
          const cfg = CARD_CONFIGS[i]!;
          return (
            <div
              key={img.id}
              style={{
                position: "absolute",
                top: cfg.yOffset,
                left: cfg.xOffset,
                right: i === 1 ? "0" : "auto",
                width: "280px",
                height: "360px",
                zIndex: cfg.z,
                transform: `rotate(${cfg.rot})`,
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
                animation: `card-float 6s ease-in-out ${cfg.floatDelay} infinite`,
                ["--card-rot" as string]: cfg.rot,
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                priority={i === 1}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                }}
              />
              <div style={{ position: "absolute", bottom: 16, left: 16, color: "#fff" }}>
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{img.label}</p>
                <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>{img.sub}</p>
              </div>
            </div>
          );
        })}
        {/* Live badge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            background: "rgba(247,37,133,0.15)",
            border: "1px solid rgba(247,37,133,0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: "10px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#f72585",
                boxShadow: "0 0 8px #f72585",
                display: "inline-block",
                animation: "glow-pulse 1.8s ease-in-out infinite",
              }}
            />
            <span style={{ color: "var(--l-text)", fontSize: 13, fontWeight: 600 }}>Live Events</span>
          </div>
          <p style={{ color: "var(--l-gold)", fontSize: 20, fontWeight: 700, margin: "4px 0 0" }}>2,000+</p>
          <p style={{ color: "var(--l-text-muted)", fontSize: 11, margin: 0 }}>Active Vendors</p>
        </div>
      </div>

      {/* Carousel — mobile fallback */}
      <div className="relative overflow-hidden rounded-2xl lg:hidden" style={{ border: "1px solid var(--l-border)" }}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {STACK_IMAGES.map((img) => (
              <div key={img.id} className="relative min-w-full flex-[0_0_100%]">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                    <h3 className="mb-1 text-xl font-bold">{img.label}</h3>
                    <p className="text-sm text-gray-300">{img.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={scrollPrev}
          className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60"
          aria-label="Previous"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button
          onClick={scrollNext}
          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60"
          aria-label="Next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
};

/* ── Category ticker ── */
const CategoryTicker = () => {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid var(--l-border)",
        borderBottom: "1px solid var(--l-border)",
        padding: "12px 0",
      }}
    >
      <div className="l-ticker-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              whiteSpace: "nowrap",
              padding: "0 28px",
              color: "#8888aa",
              fontSize: 13,
              fontWeight: 500,
              borderRight: "1px solid var(--l-border)",
              cursor: "default",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f0f0f8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8888aa"; }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Main Hero ── */
const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"login" | "join">("login");
  const { profile } = useAuthStore();
  const { headerHeight } = useUiStore();
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const openModal = (view: "login" | "join") => {
    setModalView(view);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const STATS = [
    { value: "2,000+", label: "Verified Vendors" },
    { value: "98%",    label: "5-Star Reviews" },
    { value: "36",     label: "States Covered" },
  ];

  return (
    <section
      className="landing relative overflow-hidden"
      style={{
        background: "var(--l-bg)",
        paddingTop: headerHeight ? `${headerHeight}px` : undefined,
        minHeight: "100vh",
      }}
    >
      {/* ── Ambient orbs ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(247,37,133,0.22) 0%, transparent 70%)",
          animation: "orb-breathe 12s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          right: "-8%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(114,9,183,0.22) 0%, transparent 70%)",
          animation: "orb-breathe 16s ease-in-out 2s infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 container mx-auto px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left column */}
          <div className="text-center lg:text-left">
            {/* Eyebrow tag */}
            <div
              className="l-section-tag"
              style={{
                display: "inline-flex",
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
              }}
            >
              <span>✦</span> Nigeria&apos;s #1 Event Marketplace
            </div>

            {/* Stagger headline */}
            <AnimatedHeadline />

            {/* Subtext */}
            <p
              style={{
                color: "var(--l-text-muted)",
                fontSize: 17,
                lineHeight: 1.7,
                marginTop: 20,
                maxWidth: 480,
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s",
              }}
              className="mx-auto lg:mx-0"
            >
              Connect with top talent, plan your dream event, and celebrate in
              style. From weddings in Lagos to corporate galas in Abuja.
            </p>

            {/* CTA buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 32,
                justifyContent: "center",
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.6s ease 0.9s, transform 0.6s ease 0.9s",
              }}
              className="lg:justify-start"
            >
              <button
                id="hero-find-vendors-btn"
                className="l-btn-primary"
                onClick={() => openModal("login")}
              >
                Find Vendors
              </button>
              <button
                id="hero-plan-event-btn"
                className="l-btn-secondary"
                onClick={() => openModal("login")}
              >
                Plan an Event
              </button>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "32px",
                marginTop: 48,
                justifyContent: "center",
                opacity: contentVisible ? 1 : 0,
                transition: "opacity 0.6s ease 1.1s",
              }}
              className="lg:justify-start"
            >
              {STATS.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="l-stat-number">{s.value}</div>
                  <p style={{ color: "var(--l-text-muted)", fontSize: 13, fontWeight: 500, marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — floating card stack */}
          <div
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s",
            }}
          >
            <FloatingCardStack />
          </div>
        </div>
      </div>

      {/* ── Category ticker ── */}
      <div className="relative z-10" style={{ marginTop: 16 }}>
        <CategoryTicker />
      </div>

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <LoginJoinComponent isModal={true} initialView={modalView} onClose={closeModal} />
        </Modal>
      )}
    </section>
  );
};

export default Hero;
