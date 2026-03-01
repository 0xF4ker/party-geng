import { db } from "@/server/db";
import { NextResponse } from "next/server";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const {eventId} = await params;
  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }
  const event = await db.clientEvent.findUnique({
    where: { id: eventId },
    include: {
      client: true,
      wishlist: {
        include: {
          items: {
            take: 5,
            select: {
                name: true,
                itemType: true,
            }
          },
        },
      },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({
    title: event.title,
    clientName: event.client.name,
    wishlistItems: event.wishlist?.items ?? [],
  });
}
