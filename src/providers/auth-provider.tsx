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
      retry: 2,
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

  const isHealPending = healAccountMutation.isPending;

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(!!session);
      if (!session) {
        setProfile(null);
        void utils.user.getProfile.reset();
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void utils.user.getProfile.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, utils]);

  const { mutate: healAccount, isPending: isHealPending } = healAccountMutation;

  // 4. Update Store, Enforce Onboarding & Detect Orphans
  useEffect(() => {
    if (hasSession && profile) {
      const isProfileChanged =
        JSON.stringify(profile) !== JSON.stringify(storedProfile);

      if (isProfileChanged) {
        setProfile(profile);
      }
    }

    if (hasSession && !isProfileLoading) {
      if (!profile || !profile.isOnboarded) {
        if (!pathname.startsWith("/onboarding")) {
          console.warn("User has not completed onboarding. Redirecting...");
          router.push("/onboarding");
        }
        return;
      }

      if (pathname.startsWith("/login") || pathname.startsWith("/join")) {
        router.push(
          profile.role === "VENDOR" ? "/vendor/dashboard" : "/dashboard",
        );
        return;
      }

      // --- THE HEALER LOGIC ---
      const isProfileIncomplete =
        (profile.role === "VENDOR" && !profile.vendorProfile) ||
        (profile.role === "CLIENT" && !profile.clientProfile);

      if (isProfileIncomplete && !isHealPending) {
        console.warn("User account incomplete. Attempting to repair...");
        healAccount();
      }
    }
  }, [
    profile,
    storedProfile,
    setProfile,
    hasSession,
    isProfileLoading,
    isHealPending,
    healAccount,
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
