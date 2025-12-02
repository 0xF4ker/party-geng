import { db } from "@/server/db";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId;

  if (!eventId) {
    return new Response("Event ID is required", { status: 400 });
  }

  const event = await db.clientEvent.findUnique({
    where: { id: eventId },
    include: {
      client: {
        include: {
            user: true,
        }
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

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const wishlistItems = event.wishlist?.items.map((item) => item.name) ?? [];

  return new ImageResponse(
    (
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
        }}
      >
        <div style={{ marginTop: 40 }}>
            Come celebrate {event.client.name}'s {event.title}!
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
            {wishlistItems.map((item, i) => <span key={i}>- {item}</span>)}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
