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

  // Fetch data using the heavy Prisma/DB client
  const event = await db.clientEvent.findUnique({
    where: { id: eventId },
    include: {
      client: true,
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
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Return only the necessary, lightweight data
  return NextResponse.json({
    title: event.title,
    clientName: event.client.name,
    wishlistItems: event.wishlist?.items.map((item) => item.name) ?? [],
  });
}
