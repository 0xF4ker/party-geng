"use client";

import { Plus } from "lucide-react";
import { useCreatePostModal } from "@/stores/createPostModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const CreatePostButton = () => {
  const { onOpen } = useCreatePostModal();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={() => onOpen()}
      // UPDATED: bottom-24 for mobile (clears nav), lg:bottom-6 for desktop
      className="fixed right-6 bottom-24 z-50 h-14 w-14 rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none lg:bottom-6 lg:h-16 lg:w-16"
      aria-label="Create new post"
    >
      <Plus className="h-8 w-8" />
    </Button>
  );
};
