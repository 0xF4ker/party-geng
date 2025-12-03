import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Define the expected type for the dynamic parameters with Promise wrapping
type RouteContext = { params: Promise<{ eventId: string }> };

// Define the structure of the data fetched from the internal API
type EventData = {
  title: string;
  clientName: string;
  wishlistItems: string[];
};

// Define runtime for Edge
export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: RouteContext, // Using the required Promise type
) {
  // Accessing params using await, as requested
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

  // Logging successful data before ImageResponse call
  console.log("Generating image with data:", {
    title,
    clientName,
    wishlistItems,
  });

  // 2. Render the image
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex", // REQUIRED
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          fontSize: 32,
          fontWeight: 600,
          textAlign: "center",
          padding: 50,
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          🎉 Come celebrate
          <span style={{ fontWeight: 800 }}>
            {clientName}&apos;s {title}
          </span>
          !
        </div>

        {wishlistItems.length > 0 && (
          <div
            style={{ display: "flex", flexDirection: "column", fontSize: 24 }}
          >
            <span
              style={{ marginBottom: 10, fontWeight: 700, color: "#4A5568" }}
            >
              Wishlist Sneak Peek:
            </span>
            {wishlistItems.map((item: string, i: number) => (
              <span key={item + i} style={{ margin: "5px 0" }}>
                • {item}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
