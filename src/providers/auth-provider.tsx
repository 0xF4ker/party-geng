"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const storedProfile = useAuthStore((state) => state.profile);

  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const utils = api.useUtils();

  const router = useRouter();
  const pathname = usePathname();

  // 1. Fetch Profile
  const { data: profile, isLoading: isProfileLoading } =
    api.user.getProfile.useQuery(undefined, {
      enabled: hasSession,
      staleTime: 1000 * 60 * 5,
      retry: false,
    });

  // 2. THE HEALER
  const healAccountMutation = api.auth.healAccount.useMutation({
    onSuccess: async () => {
      toast.success("Account profile restored.");
      await utils.user.getProfile.invalidate();
    },
    onError: () => {
      const supabase = createClient();
      void supabase.auth.signOut();
      setHasSession(false);
      setProfile(null);
      toast.error("Account error. Please log in again.");
    },
  });

  // 3. Check session on mount
  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setIsSessionChecked(true);

      if (!session) {
        setProfile(null);
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      if (!session) {
        setProfile(null);
        void utils.user.getProfile.reset();
      } else {
        void utils.user.getProfile.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, utils]);

  useEffect(() => {
    if (hasSession && profile) {
      const isProfileChanged =
        JSON.stringify(profile) !== JSON.stringify(storedProfile);

      if (isProfileChanged) {
        setProfile(profile);
      }
    }

    // Define Incomplete Profile (Corrupted data: User exists but sub-profile is missing)
    const isProfileIncomplete =
      profile &&
      ((profile.role === "VENDOR" && !profile.vendorProfile) ||
        (profile.role === "CLIENT" && !profile.clientProfile));

    if (hasSession && !isProfileLoading) {
      // SCENARIO A: Brand new user (No Prisma profile exists yet)
      if (!profile) {
        if (
          !pathname.startsWith("/onboarding") &&
          !pathname.startsWith("/login") &&
          !pathname.startsWith("/join")
        ) {
          console.warn("No profile found. Redirecting to onboarding...");
          router.push("/onboarding");
        }
      }
      // SCENARIO B: Corrupted User (Profile exists, but missing sub-tables)
      else if (isProfileIncomplete && !healAccountMutation.isPending) {
        console.warn("User account incomplete. Attempting to repair...");
        healAccountMutation.mutate();
      }
    }
  }, [
    profile,
    storedProfile,
    setProfile,
    hasSession,
    isProfileLoading,
    healAccountMutation,
    pathname,
    router,
  ]);

  // 5. Global Loading State
  useEffect(() => {
    const isLoading = !isSessionChecked || (hasSession && isProfileLoading);
    setIsLoading(isLoading);
  }, [isSessionChecked, hasSession, isProfileLoading, setIsLoading]);

  return <>{children}</>;
}
