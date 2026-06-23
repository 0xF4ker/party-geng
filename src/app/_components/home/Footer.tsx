import React from "react";
import Link from "next/link";
import { siX, siFacebook, siInstagram } from "simple-icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Accessibility, Globe } from "lucide-react";
import Image from "next/image";
import ClientOnly from "@/components/ui/ClientOnly";

const footerSections = [
  {
    title: "About",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-service", label: "Terms of Service" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help-and-support", label: "Help & Support" },
      { href: "/frequently-asked-questions", label: "FAQ" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/events", label: "Events" },
      { href: "/forum", label: "Forum" },
    ],
  },
  {
    title: "More From Partygeng",
    links: [
      { href: "/partygeng-business", label: "PartyGeng Business" },
      { href: "/partygeng-pro", label: "PartyGeng Pro" },
    ],
  },
];

const socialLinks = [
  { href: "https://x.com/partygeng", icon: siX, label: "X (Formerly Twitter)" },
  { href: "https://www.facebook.com/profile.php?id=61585899313473", icon: siFacebook, label: "Facebook" },
  { href: "https://www.instagram.com/partygengng", icon: siInstagram, label: "Instagram" },
];

const Icon = ({ path, className }: { path: string; className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d={path} />
  </svg>
);

const Footer = () => {
  return (
    <footer
      className="landing"
      style={{
        background: "var(--l-bg)",
        borderTop: "1px solid var(--l-border)",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mobile accordion */}
        <div className="py-8 lg:hidden">
          <ClientOnly>
            <Accordion type="single" collapsible className="w-full">
              {footerSections.map((section) => (
                <AccordionItem
                  value={section.title}
                  key={section.title}
                  style={{ borderColor: "var(--l-border)" }}
                >
                  <AccordionTrigger style={{ color: "var(--l-text)", fontSize: 15, fontWeight: 600 }}>
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            style={{ color: "var(--l-text-muted)", fontSize: 14, textDecoration: "none", transition: "color 0.2s ease" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text-muted)"; }}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ClientOnly>
        </div>

        {/* Desktop grid */}
        <div className="hidden gap-8 py-16 lg:grid lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 style={{ color: "var(--l-text)", fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                {section.title}
              </h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ color: "#8888aa", fontSize: 14, textDecoration: "none", transition: "color 0.2s ease" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f0f0f8"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8888aa"; }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--l-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            padding: "28px 0",
          }}
          className="lg:flex-row"
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }} className="lg:flex-row lg:gap-4">
            <Image
              src="/logo.png"
              alt="PartyGeng Logo"
              width={120}
              height={40}
              className="h-5 w-auto object-contain"
              style={{ opacity: 0.8 }}
            />
            <p style={{ color: "var(--l-text-muted)", fontSize: 13 }}>
              © PartyGeng International Ltd. 2025
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {/* Social icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  style={{ color: "var(--l-text-muted)", transition: "color 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-brand-pink)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text-muted)"; }}
                >
                  <Icon path={social.icon.path} />
                </Link>
              ))}
            </div>

            {/* Language / Currency / A11y */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link href="#" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--l-text-muted)", fontSize: 13, textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text-muted)"; }}>
                <Globe style={{ width: 14, height: 14 }} /> English
              </Link>
              <Link href="#" style={{ color: "var(--l-text-muted)", fontSize: 13, textDecoration: "none", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text-muted)"; }}>
                ₦ NGN
              </Link>
              <Link href="#" style={{ color: "var(--l-text-muted)", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--l-text-muted)"; }}>
                <Accessibility style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
