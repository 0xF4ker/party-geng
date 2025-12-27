import { create } from "zustand";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;

// 1. Get the two possible shapes of a post
type TrendingPost = RouterOutputs["post"]["getTrending"]["posts"][number];
type DetailedPost = RouterOutputs["post"]["getById"];

// 2. Create a Union Type (It can be either a Snapshot OR a Full Detail)
// This tells TypeScript: "I accept any valid post object from our system"
type PostShape = TrendingPost | DetailedPost;

type CreatePostModalStore = {
  isOpen: boolean;
  postToEdit: PostShape | null;
  // 3. Update the function signature to accept the Union
  onOpen: (postToEdit?: PostShape) => void;
  onClose: () => void;
};

export const useCreatePostModal = create<CreatePostModalStore>((set) => ({
  isOpen: false,
  postToEdit: null,
  onOpen: (postToEdit) => set({ isOpen: true, postToEdit: postToEdit ?? null }),
  onClose: () => set({ isOpen: false, postToEdit: null }),
}));
