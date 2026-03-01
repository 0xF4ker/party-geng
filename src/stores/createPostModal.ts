import { create } from "zustand";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
type RouterOutputs = inferRouterOutputs<AppRouter>;
type TrendingPost = RouterOutputs["post"]["getTrending"]["posts"][number];
type DetailedPost = RouterOutputs["post"]["getById"];
export type PostShape = TrendingPost | DetailedPost;
type CreatePostModalStore = {
  isOpen: boolean;
  postToEdit: PostShape | null;
  onOpen: (postToEdit?: PostShape) => void;
  onClose: () => void;
};
export const useCreatePostModal = create<CreatePostModalStore>((set) => ({
  isOpen: false,
  postToEdit: null,
  onOpen: (postToEdit) => set({ isOpen: true, postToEdit: postToEdit ?? null }),
  onClose: () => set({ isOpen: false, postToEdit: null }),
}));
