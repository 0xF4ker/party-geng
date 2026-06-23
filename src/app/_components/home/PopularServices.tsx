"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaPluginType } from "embla-carousel";
import { api } from "@/trpc/react";

const CATEGORY_IMAGES: Record<string, string> = {
  "Music & DJs": "/event-assets/e1599dd5-b393-4698-96b1-da811cc17065.jpg",
  "Food & Beverage": "/event-assets/7559b777-a27c-4ef8-9f71-9f8413c135f8.jpg",
  Media: "/event-assets/9643dd1a-54f9-42e6-8545-3d33ac2fa109.jpg",
  Planning: "/event-assets/ee4dcf92-748c-4995-839d-f00d502abc31.jpg",
  "Decor & Design": "/event-assets/e07c8405-3ec3-48ac-bc60-f2f9dc61d72c.jpg",
  Entertainment: "/event-assets/a9b65768-b894-44db-bb63-332a631fdebe.jpg",
  "Equipment Rental": "/event-assets/00f63a28-6006-42af-9a69-c064a333977a.jpg",
  Transportation: "/event-assets/6adc089e-464b-481b-8087-29bc9b331ee3.jpg",
  "Personal Style": "/event-assets/5ec493b6-99b3-48ca-bfdd-92a35801eaeb.jpg",
  "Event Staffing": "/event-assets/a3e3fa3e-41fd-4827-8a79-d9e954497c1f.jpg",
  "Event Venue": "/event-assets/5a132bcc-0437-4c5f-a5f9-ff7518f7b50a.jpg",
};
const DEFAULT_IMAGE = "https://placehold.co/250x350/9ca3af/ffffff?text=Service";

const PopularServices = () => {
  const { data: categories } = api.category.getAll.useQuery();

  const [autoplayPlugin] = useState(() => {
    const AP = Autoplay as unknown as (opts?: {
      delay?: number;
      stopOnInteraction?: boolean;
      stopOnMouseEnter?: boolean;
    }) => EmblaPluginType;
    return AP({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true });
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [autoplayPlugin],
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const itemsToDisplay =
    categories?.map((cat) => ({
      name: cat.name,
      image: CATEGORY_IMAGES[cat.name] ?? DEFAULT_IMAGE,
      url: `/categories/${cat.slug}`,
    })) ?? [];

  const fallbackItems = Object.entries(CATEGORY_IMAGES).map(([name, image]) => ({
    name,
    image,
    url: `/categories/${name.toLowerCase().replace(/ & /g, "-and-").replace(/ /g, "-")}`,
  }));

  const displayItems = itemsToDisplay.length > 0 ? itemsToDisplay : fallbackItems;

  return (
    <section
      className="landing"
      style={{ background: "var(--l-bg)", padding: "80px 0 96px" }}
    >
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div className="l-section-tag">Browse All</div>
            <h2
              style={{
                color: "var(--l-text)",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Explore Categories
            </h2>
          </div>

          {/* Navigation arrows */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={scrollPrev}
              aria-label="Previous"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--l-surface)",
                border: "1px solid var(--l-border)",
                color: "var(--l-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(247,37,133,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(247,37,133,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--l-surface)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--l-border)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--l-surface)",
                border: "1px solid var(--l-border)",
                color: "var(--l-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(247,37,133,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(247,37,133,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--l-surface)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--l-border)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex">
            {displayItems.map((item) => (
              <div
                className="shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                key={item.name}
              >
<Link
                  href={item.url}
                  className="l-card"
                  style={{ borderRadius: 16, display: "block", position: "relative", height: 340, overflow: "hidden" }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const label = e.currentTarget.querySelector('.browse-label') as HTMLElement;
                    if (img) (img as HTMLElement).style.transform = 'scale(1.08)';
                    if (label) label.style.color = '#f9a8d4';
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const label = e.currentTarget.querySelector('.browse-label') as HTMLElement;
                    if (img) (img as HTMLElement).style.transform = 'scale(1)';
                    if (label) label.style.color = 'rgba(255,255,255,0)';
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    style={{ borderRadius: 16, transition: 'transform 0.5s ease' }}
                    className="h-full w-full object-cover"
                    width={280}
                    height={340}
                  />
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Category label */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      right: 16,
                    }}
                  >
                    <h3
                      style={{
                        color: "#fff",
                        fontSize: 17,
                        fontWeight: 700,
                        margin: 0,
                        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="browse-label"
                      style={{
                        color: "rgba(255,255,255,0)",
                        fontSize: 12,
                        margin: "4px 0 0",
                        transition: "color 0.3s ease",
                      }}
                    >
                      Browse vendors →
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
