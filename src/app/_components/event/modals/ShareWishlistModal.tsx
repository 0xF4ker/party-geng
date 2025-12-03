"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { FaFacebook, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

interface ShareWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistUrl: string;
  eventName: string;
}

export const ShareWishlistModal = ({
  isOpen,
  onClose,
  wishlistUrl,
  eventName,
}: ShareWishlistModalProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(wishlistUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link.");
      console.error("Failed to copy:", err);
    }
  };

  const shareText = `Check out the wishlist for ${eventName}!`;

  const socialLinks = [
    {
      name: "Facebook",
      icon: <FaFacebook size={32} className="text-[#1877F2]" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(wishlistUrl)}`,
    },
    {
      name: "Twitter",
      icon: <FaTwitter size={32} className="text-[#1DA1F2]" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(wishlistUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={32} className="text-[#25D366]" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${wishlistUrl}`)}`,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share this link with friends and family to fulfill your wishes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-around">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-center text-sm font-medium text-gray-600 transition-transform hover:scale-110"
              >
                {social.icon}
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Input id="link" defaultValue={wishlistUrl} readOnly />
          <Button type="button" size="sm" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
