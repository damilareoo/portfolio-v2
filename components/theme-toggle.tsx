"use client";

import { useTheme } from "next-themes";
import { GlyphIcon } from "@/components/glyph-icon";
import { useMounted } from "@/lib/use-mounted";

export function ThemeToggle() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex size-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:text-ink"
    >
      {!mounted ? (
        <span className="size-4" />
      ) : (
        <GlyphIcon name={isDark ? "dark" : "light"} size="1rem" />
      )}
    </button>
  );
}
