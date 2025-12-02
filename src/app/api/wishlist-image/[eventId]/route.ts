// Corrected and Cleaned Code
import React from "react"; // Use a simple import
import { db } from "@/server/db";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  // 1. Input Validation and extraction
  const eventId = params.eventId;

  if (!eventId) {
    return new Response("Event ID is required", { status: 400 });
  }

  // 2. Database Fetch
  const event = await db.clientEvent.findUnique({
    where: { id: eventId },
    // ... (rest of the include structure is fine)
    include: {
      client: {
        include: {
          user: true,
        }
      },
      wishlist: {
        include: {
          items: {
            take: 5,
          },
        },
      },
    },
  });

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const wishlistItems = event.wishlist?.items.map((item) => item.name) ?? [];

  // 3. Image Generation using ImageResponse
  return new ImageResponse(
    (
      <div
        // ImageResponse uses React's style object syntax, which is correct
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
          textAlign: "center", // Added for multi-line text alignment
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 20 }}>
          🎉 Come celebrate **{event.client.name}'s {event.title}**!
        </div>
        
        {wishlistItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 24 }}>
             <span style={{ marginBottom: 10, fontWeight: 700 }}>Wishlist Sneak Peek:</span>
             {/* Using item name as key is safer than index if items could change order, but index is acceptable for OG generation */}
             {wishlistItems.map((item, i) => (
                <span key={item + i} style={{ margin: '5px 0' }}>
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
