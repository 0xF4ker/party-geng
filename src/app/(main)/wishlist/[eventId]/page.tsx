import { type Metadata } from "next";
import { api } from "@/trpc/server";
import WishlistClientPage from "./WishlistClientPage";

export async function generateMetadata(
  props: PageProps<"/wishlist/[eventId]">,
): Promise<Metadata> {
  const { eventId } = await props.params;
  const event = await api.wishlist.getByEventId({ eventId });

  if (!event) {
    return {
      title: "Wishlist Not Found",
      description: "The wishlist you are looking for does not exist.",
    };
  }

  const description =
    "Contribute to the wishlist for " +
    event.title +
    ". Items include: " +
    (event.wishlist?.items.map((i) => i.name).join(", ") ?? "No items yet") +
    ".";

  return {
    title: `${event.title} Wishlist`,
    description: description,
    openGraph: {
      title: `${event.title} Wishlist`,
      description: description,
      images: [
        {
          url: `/api/wishlist-image/${event.id}`,
          width: 1200,
          height: 630,
          alt: `Wishlist for ${event.title}`,
        },
      ],
    },
  };
}

export default async function PublicWishlistPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await api.wishlist.getByEventId({ eventId: params.eventId });

  return <WishlistClientPage initialEvent={event} />;
}
