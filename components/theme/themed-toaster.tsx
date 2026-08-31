"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** react-hot-toast's default styling assumes a light background; this picks
 * readable colors for whichever theme is actually active. */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  // Deferred via microtask so this isn't a synchronous setState call
  // within the effect body itself.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setMounted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: dark
          ? { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" }
          : { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" },
      }}
    />
  );
}
