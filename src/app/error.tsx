"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };           
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);

    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/"; 
    }
  }, [error]);

  return null;
}