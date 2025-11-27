"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WishlistHeaderProps {
  title: string;
  coverImage?: string | null;
}

export const WishlistHeader = ({ title, coverImage }: WishlistHeaderProps) => {
    const router = useRouter();

    const handleShare = () => {
        const url = window.location.href;
        void navigator.clipboard.writeText(url);
        toast.success("Wishlist link copied to clipboard!");
    };

  return (
    <div className="relative h-60 w-full bg-gray-200">
      <Image
        src={coverImage ?? "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop"}
        alt="A decorative banner image for the wishlist"
        layout="fill"
        objectFit="cover"
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
        >
            <ArrowLeft />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
        >
            <Share2 />
        </Button>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
        <p className="font-medium">Help make their wishes come true for</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
      </div>
    </div>
  );
};
