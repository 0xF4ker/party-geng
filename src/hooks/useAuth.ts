"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuth() {
  const { profile, setProfile } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session (fast)
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setHasCheckedSession(true);
      
      // If no session, we can stop loading immediately
      if (!session) {
        setLoading(false);
        setProfile(null);
      } else {
        // Has session, wait a bit for profile to load
        // But show UI faster - the AuthProvider will update
        setTimeout(() => {
          setLoading(false);
        }, 200); // Small delay to let profile fetch
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // User is signed in
        // Profile will be fetched by AuthProvider
        setLoading(false);
      } else {
        // User is signed out
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/");
  };

  return {
    user: profile,
    loading,
    signOut,
    isAuthenticated: !!profile,
  };
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}
