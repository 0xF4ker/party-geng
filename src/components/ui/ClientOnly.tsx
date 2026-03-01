"use client";
import { useEffect, useState } from "react";
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <>{children}</>;
};
export default ClientOnly;
