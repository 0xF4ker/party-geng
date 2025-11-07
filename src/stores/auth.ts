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
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
