import React from "react";
import { db } from "@/server/db";
import { ImageResponse } from "next/og";

// Next.js Route Handler for requests
// Using NextRequest for 'req' and the defined RouteContext for 'context'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  console.log("Generating image for eventId:", eventId);

  if (!eventId) {
    console.error("Event ID is missing.");
    return new Response("Event ID is required", { status: 400 });
  }

  // Fetch event data with necessary relations
  const event = await db.clientEvent.findUnique({
    where: { id: eventId },
    include: {
      client: {
        include: {
          user: true,
        },
      },
      wishlist: {
        include: {
          items: {
            take: 5, // Get first 5 items
          },
        },
      },
    },
  });

  console.log("Fetched event data:", JSON.stringify(event, null, 2));

  if (!event) {
    console.error("Event not found for eventId:", eventId);
    return new Response("Event not found", { status: 404 });
  }

  const wishlistItems = event.wishlist?.items.map((item) => item.name) ?? [];
  const clientName = event.client.name ?? "A Client"; // Fallback name

  console.log(
    "Generating image with items:",
    wishlistItems,
    "and client:",
    clientName,
  );

  return new ImageResponse(
    (
      // ARGUMENT 1: The JSX element
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
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
        <div style={{ fontSize: 48, marginBottom: 20 }}>
          🎉 Come celebrate{" "}
          <span style={{ fontWeight: 800 }}>
            {clientName}&apos;s {event.title}
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
            {/* Using item name + index for key */}
            {wishlistItems.map((item, i) => (
              <span key={item + i} style={{ margin: "5px 0" }}>
                • {item}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
    // ARGUMENT 2: The options object
    {
      width: 1200,
      height: 630,
      // You can also pass the status code here:
      // status: event ? 200 : 404,
    },
  );
}
