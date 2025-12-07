import { create } from "zustand";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type Post = inferRouterOutputs<AppRouter>["post"]["getById"];

type CreatePostModalStore = {
  isOpen: boolean;
  postToEdit: Post | null;
  onOpen: (postToEdit?: Post) => void;
  onClose: () => void;
};

export const useCreatePostModal = create<CreatePostModalStore>((set) => ({
  isOpen: false,
  postToEdit: null,
  onOpen: (postToEdit) => set({ isOpen: true, postToEdit: postToEdit ?? null }),
  onClose: () => set({ isOpen: false, postToEdit: null }),
}));
