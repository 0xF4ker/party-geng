"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type OnlineStatus = "ONLINE" | "IDLE" | "DND" | "OFFLINE";

export const usePresence = (currentUserId: string | undefined, currentStatusOverride: string | undefined) => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineStatus>>({});
  const [effectiveStatus, setEffectiveStatus] = useState<string>("ONLINE");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sync status when database setting loads/changes
  useEffect(() => {
    if (currentStatusOverride) {
      setEffectiveStatus(currentStatusOverride);
    }
  }, [currentStatusOverride]);

  // Auto-idle detection (only applies if the user's manual status is ONLINE)
  useEffect(() => {
    if (currentStatusOverride !== "ONLINE") return;

    let idleTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
      setEffectiveStatus("ONLINE");
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setEffectiveStatus("IDLE");
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleActivity = () => resetIdleTimer();

    events.forEach((name) => window.addEventListener(name, handleActivity));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      events.forEach((name) => window.removeEventListener(name, handleActivity));
    };
  }, [currentStatusOverride]);

  // Sync Supabase presence
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: Record<string, OnlineStatus> = {};
        
        Object.keys(state).forEach((userId) => {
          const presences = state[userId];
          if (presences && presences.length > 0) {
            const mainPresence = presences[0] as unknown as { status?: string };
            if (mainPresence && mainPresence.status !== "INVISIBLE") {
              users[userId] = (mainPresence.status as OnlineStatus) ?? "ONLINE";
            }
          }
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (effectiveStatus !== "INVISIBLE") {
            await channel.track({
              status: effectiveStatus,
              lastSeen: new Date().toISOString(),
            });
          } else {
            // Un-track presence when invisible
            await channel.untrack();
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
      channelRef.current = null;
    };
  }, [currentUserId, effectiveStatus]);

  return { onlineUsers };
};
