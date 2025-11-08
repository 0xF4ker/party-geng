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

const footerSections = [
  {
    title: "Categories",
    links: [
      { href: "/categories/bands", label: "Bands" },
      { href: "/categories/solo-musicians", label: "Solo Musicians" },
      { href: "/categories/ensembles", label: "Ensembles" },
      { href: "/categories/djs", label: "DJs" },
      { href: "/categories/variety-acts", label: "Variety Acts" },
      { href: "/categories/speakers", label: "Speakers" },
      { href: "/categories/comedians", label: "Comedians" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/careers", label: "Careers" },
      { href: "/press-and-news", label: "Press & News" },
      { href: "/partnerships", label: "Partnerships" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-service", label: "Terms of Service" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help-and-support", label: "Help & Support" },
      { href: "/trust-and-safety", label: "Trust & Safety" },
      { href: "/selling-on-partygeng", label: "Selling on PartyGeng" },
      { href: "/buying-on-partygeng", label: "Buying on PartyGeng" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/events", label: "Events" },
      { href: "/blog", label: "Blog" },
      { href: "/forum", label: "Forum" },
      { href: "/community-standards", label: "Community Standards" },
      { href: "/podcast", label: "Podcast" },
      { href: "/affiliates", label: "Affiliates" },
    ],
  },
  {
    title: "More From Partygeng",
    links: [
      { href: "/partygeng-business", label: "PartyGeng Business" },
      { href: "/partygeng-pro", label: "PartyGeng Pro" },
      { href: "/partygeng-guides", label: "PartyGeng Guides" },
      { href: "/get-inspired", label: "Get Inspired" },
      { href: "/clearvoice", label: "ClearVoice" },
      { href: "/learn", label: "Learn" },
    ],
  },
];

const socialLinks = [
  { href: "#", icon: siX, label: "X (Formerly Twitter)" },
  { href: "#", icon: siFacebook, label: "Facebook" },
  { href: "#", icon: siInstagram, label: "Instagram" },
];

const Icon = ({ path, className }: { path: string; className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={path} />
  </svg>
);

const Footer = () => {
  return (
    <footer className="border-border/40 border-t bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile and Tablet Accordion View */}
        <div className="py-8 lg:hidden">
          <Accordion type="single" collapsible className="w-full">
            {footerSections.map((section) => (
              <AccordionItem value={section.title} key={section.title}>
                <AccordionTrigger className="text-lg font-bold">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pt-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="hover:text-primary transition-colors"
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
        </div>

        {/* Desktop Grid View */}
        <div className="hidden gap-8 py-16 lg:grid lg:grid-cols-5">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-6 text-lg font-bold">{section.title}</h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/40 flex flex-col items-center justify-between border-t py-8 lg:flex-row">
          <div className="mb-6 flex flex-col items-center lg:mb-0 lg:flex-row">
            {/* <h2 className="brand-text-gradient text-3xl font-bold">
              Partygeng
            </h2> */}
            <Image
              src="/logo.png"
              alt="PartyGeng Logo"
              width={150}
              height={50}
              className="ml-4 h-6 w-auto object-contain"
            />
            <p className="mt-2 text-sm lg:mt-1 lg:ml-4">
              &copy; PartyGeng International Ltd. 2025
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6">
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="hover:text-primary transition-colors"
                >
                  <Icon path={social.icon.path} />
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="#"
                className="hover:text-primary flex items-center transition-colors"
              >
                <span className="mr-1">
                  <Globe />
                </span>
                <span>English</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <span>&#8358;</span>
                <span> NGN</span>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <span className="text-xl">
                  <Accessibility />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
