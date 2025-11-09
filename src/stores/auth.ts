import { create } from "zustand";
import {
  type User,
  type VendorProfile,
  type ClientProfile,
} from "@prisma/client";

export type Profile = User & {
  vendorProfile: VendorProfile | null;
  clientProfile: ClientProfile | null;
};

interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
