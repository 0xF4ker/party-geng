import React from "react";
import { Search, Calendar, Users, Heart, Camera, Star } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Find Your Perfect Match",
    description:
      "Discover verified vendors that match your style and budget. From DJs to decorators.",
    glowColor: "#f72585",
  },
  {
    icon: Calendar,
    title: "Stress-Free Planning",
    description:
      "Stay organised with smart tools. Manage guest lists, budgets, and timelines all in one place.",
    glowColor: "#7209b7",
  },
  {
    icon: Users,
    title: "Join the Party",
    description:
      "Connect with a vibrant community of party lovers. Share tips, get advice, and find inspiration.",
    glowColor: "#4361ee",
  },
  {
    icon: Heart,
    title: "Save What You Love",
    description:
      "Build your dream event board. Save your favourite vendors and ideas for when you're ready to book.",
    glowColor: "#f72585",
  },
  {
    icon: Camera,
    title: "Showcase Your Style",
    description:
      "Share your event photos and build your portfolio. Let the world see your creativity.",
    glowColor: "#b5179e",
  },
  {
    icon: Star,
    title: "Trust & Transparency",
    description:
      "Read real reviews from real clients. Book with confidence knowing you're getting quality.",
    glowColor: "#ffbe0b",
  },
];

const FeaturesSection = () => {
  return (
    <section
      className="landing"
      style={{ background: "var(--l-bg)", padding: "96px 0" }}
    >
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="l-section-tag" style={{ justifyContent: "center" }}>
            Why PartyGeng
          </div>
          <h2
            style={{
              color: "var(--l-text)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            Everything You Need for{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #f72585, #b5179e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Unforgettable Events
            </span>
          </h2>
          <p style={{ color: "var(--l-text-muted)", fontSize: 16, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            A complete ecosystem to help you plan, book, and celebrate without the hassle.
          </p>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="l-card"
                style={{ padding: 28 }}
              >
                {/* Icon with radial glow */}
                <div
                  className="l-icon-glow"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: `${feature.glowColor}18`,
                    border: `1px solid ${feature.glowColor}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    ["--l-glow-color" as string]: feature.glowColor,
                  }}
                >
                  <Icon
                    style={{ width: 24, height: 24, color: feature.glowColor }}
                  />
                </div>

                <h3
                  style={{
                    color: "var(--l-text)",
                    fontSize: 17,
                    fontWeight: 700,
                    margin: "0 0 10px",
                    lineHeight: 1.3,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "var(--l-text-muted)",
                    fontSize: 14,
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
