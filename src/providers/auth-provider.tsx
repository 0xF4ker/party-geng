"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile } = useAuthStore();
  const { data: profile } = api.user.getProfile.useQuery();

  useEffect(() => {
    if (profile) {
      setProfile(profile);
    }
  }, [profile, setProfile]);

  return <>{children}</>;
}
