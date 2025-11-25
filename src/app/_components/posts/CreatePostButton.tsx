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
      className="fixed bottom-28 right-8 h-16 w-16 rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 z-30"
      aria-label="Create new post"
    >
      <Plus className="h-8 w-8" />
    </Button>
  );
};
