"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "System", icon: "◐" },
] as const;

/** Small Light/Dark/System cycling toggle for the app header / profile area. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // Avoid rendering theme-dependent UI before mount, since the resolved
  // theme isn't known on the server (prevents a hydration mismatch).
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

  if (!mounted) {
    return (
      <div
        className={`h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 ${className}`}
        aria-hidden
      />
    );
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];

  function cycle() {
    const idx = OPTIONS.findIndex((o) => o.value === theme);
    const next = OPTIONS[(idx + 1) % OPTIONS.length];
    setTheme(next.value);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${current.label} (click to change)`}
      aria-label={`Theme: ${current.label}. Click to change.`}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
    >
      <span aria-hidden>{current.icon}</span>
    </button>
  );
}
