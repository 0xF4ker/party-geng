"use client";

import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";

export function GlobalLoader() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const [progress, setProgress] = useState(0);

  // Trick: Fake progress animation when loading starts
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      setProgress(30); // Start at 30% immediately
      // Slowly increase to 90% but never hit 100% until finished
      timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 500);
    } else {
      setProgress(100); // Finish
      // Hide after animation
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  if (progress === 0 && !isLoading) return null;

  return (
    <div className="fixed top-0 left-0 z-[100] h-1 w-full overflow-hidden">
      <div
        className="h-full bg-black transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />

      {/* Optional: A subtle glow/shadow under the bar */}
      <div
        className="absolute top-0 right-0 h-full w-[100px] rotate-3 opacity-50 shadow-[0_0_10px_#000,0_0_5px_#000]"
        style={{ left: `${progress}%`, transform: "translate(-100%)" }}
      />
    </div>
  );
}
