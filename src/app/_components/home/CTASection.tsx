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
    <section
      className="landing"
      style={{ background: "var(--l-bg)", padding: "24px 24px 96px" }}
    >
      <div className="container mx-auto">
        {/* Gradient card */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 28,
            padding: "80px 48px",
            textAlign: "center",
            background: "linear-gradient(135deg, #7209b7 0%, #b5179e 50%, #f72585 100%)",
            boxShadow: "0 40px 100px rgba(114,9,183,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* Decorative orbs inside card */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -80,
              left: -80,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -60,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background: "rgba(247,37,133,0.25)",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 10, maxWidth: 640, margin: "0 auto" }}>
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 9999,
                padding: "6px 16px",
                marginBottom: 24,
              }}
            >
              <Sparkles style={{ width: 14, height: 14, color: "#ffbe0b" }} />
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
                Join Nigeria&apos;s Fastest Growing Event Network
              </span>
            </div>

            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 700,
                lineHeight: 1.15,
                margin: "0 0 20px",
              }}
            >
              Ready to Turn Your Passion into Profit?
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 17,
                lineHeight: 1.7,
                marginBottom: 40,
              }}
            >
              Whether you&apos;re a DJ, photographer, caterer, or venue owner —
              PartyGeng connects you with clients looking for your specific talents.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                justifyContent: "center",
              }}
            >
              <Link
                href={becomeVendorHref}
                id="cta-become-vendor-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  color: "#7209b7",
                  borderRadius: 9999,
                  padding: "15px 36px",
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
                }}
              >
                Become a Vendor
              </Link>

              <Link
                href={planEventHref}
                id="cta-plan-event-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderRadius: 9999,
                  padding: "14px 36px",
                  fontWeight: 600,
                  fontSize: 16,
                  textDecoration: "none",
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.55)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Planning an Event?
              </Link>
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                marginTop: 28,
              }}
            >
              Free to join &nbsp;·&nbsp; Secure payments &nbsp;·&nbsp; 24/7 Support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
