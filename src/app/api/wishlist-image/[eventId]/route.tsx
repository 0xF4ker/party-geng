import React from "react";
import { ImageResponse } from "next/og"; // Removed 'Image'
import type { NextRequest } from "next/server";

// Define the expected type for the dynamic parameters with Promise wrapping
type RouteContext = { params: Promise<{ eventId: string }> };

// Define the structure of the data fetched from the internal API
type EventData = {
  title: string;
  clientName: string;
  wishlistItems: { name: string; itemType: string }[];
};

// Define runtime for Edge
export const runtime = "edge";

export async function GET(request: NextRequest, { params }: RouteContext) {
  // Accessing params using await
  const { eventId } = await params;

  if (!eventId) {
    return new Response("Event ID is required", { status: 400 });
  }

  // 1. FETCH DATA from the separate, Node.js API Route
  const dataApiUrl = `${request.nextUrl.origin}/api/event-data/${eventId}`;
  const response = await fetch(dataApiUrl);

  if (!response.ok) {
    console.error(
      "Failed to fetch data from internal API:",
      response.status,
      response.statusText,
    );
    return new Response(
      `Failed to fetch event data. Status: ${response.status}`,
      { status: 500 },
    );
  }

  const eventData = (await response.json()) as EventData;
  const { title, clientName, wishlistItems } = eventData;

  console.log("Generating image with data:", {
    title,
    clientName,
    wishlistItems,
  });

  // 2. Prepare Logo (Fetch and convert to Base64 for the <img> tag)
  const logoUrl = new URL("/logo.png", request.nextUrl.origin);
  const logoResponse = await fetch(logoUrl);
  const logoBuffer = await logoResponse.arrayBuffer();
  // Convert buffer to base64 string
  const logoBase64 = Buffer.from(logoBuffer).toString("base64");
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  // 3. Render the image
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fbe2f3",
          padding: 50,
          backgroundImage: "linear-gradient(to bottom right, #fbe2f3, #e9d5ff)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width="150" alt="logo" />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 20, display: "flex" }}>
            <span>🎉 You&apos;re invited to celebrate</span>
          </div>
          <div style={{ color: "#c026d3", display: "flex" }}>
            <b>
              {clientName}&apos;s {title}!
            </b>
          </div>
        </div>

        {wishlistItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 24,
              alignItems: "center",
            }}
          >
            <span
              style={{ marginBottom: 10, fontWeight: 700, color: "#4A5568" }}
            >
              Here&apos;s a sneak peek of their wishlist:
            </span>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {wishlistItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    padding: "5px 15px",
                    borderRadius: "20px",
                  }}
                >
                  <span style={{ marginRight: 8, fontSize: 20 }}>
                    {item.itemType === "CASH_REQUEST" ? "💰" : "🎁"}
                  </span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            alignSelf: "flex-end",
            fontSize: 18,
            color: "#6b7280",
            display: "flex",
          }}
        >
          <span>Powered by PartyGeng</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
