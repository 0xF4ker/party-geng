"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile } = useAuthStore();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Only fetch profile if we have a session
  const {
    data: profile,
    isLoading,
    error,
  } = api.user.getProfile.useQuery(undefined, {
    enabled: hasSession === true, // Only run query if session exists
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Quick session check on mount
  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "[AuthProvider] Session check:",
        session ? "Has session" : "No session",
      );
      setHasSession(!!session);

      if (!session) {
        // No session, clear profile immediately
        setProfile(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AuthProvider] Auth state changed:", _event);
      setHasSession(!!session);

      if (!session) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile]);

  // Update profile when fetched
  useEffect(() => {
    if (profile) {
      console.log("[AuthProvider] Setting profile:", profile);
      setProfile(profile);
    } else if (hasSession === false) {
      // Ensure profile is cleared if no session
      setProfile(null);
    }
  }, [profile, hasSession, setProfile]);

  return <>{children}</>;
}
