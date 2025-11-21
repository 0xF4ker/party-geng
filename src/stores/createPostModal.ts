import { create } from "zustand";

type CreatePostModalStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useCreatePostModal = create<CreatePostModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
