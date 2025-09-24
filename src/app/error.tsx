"use client";

import MyError from "@services/MyError";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    MyError(error);
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/";
    }
  }, [error]);

  return null;
}
