"use client";

import { useTheme } from "next-themes";
import { GlyphIcon } from "@/components/glyph-icon";
import { useDialTurns } from "@/lib/dial-turns";
import type { IconName } from "@/lib/glyph/icons";
import { useMounted } from "@/lib/use-mounted";

/**
 * Three states, three targets — light, dark, and system as separate controls
 * rather than one button that cycles. A cycling toggle hides where you are and
 * makes "follow the system" unreachable without guessing.
 */
const MODES: { value: string; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "light" },
  { value: "dark", label: "Dark", icon: "dark" },
  { value: "system", label: "System", icon: "system" },
];

export function ThemeControl() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { record } = useDialTurns();

  return (
    <div className="flex items-center gap-0.5">
      {MODES.map((mode) => {
        const active = mounted && theme === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            aria-label={mode.label}
            aria-pressed={active}
            onClick={() => {
              setTheme(mode.value);
              // Re-selecting the mode you are already on is not a turn.
              if (mounted && theme !== mode.value) record();
            }}
            className={`flex size-6 items-center justify-center rounded-[4px] transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <GlyphIcon name={mode.icon} size="0.875rem" />
          </button>
        );
      })}
    </div>
  );
}
