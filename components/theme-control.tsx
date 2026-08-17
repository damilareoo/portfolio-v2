"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useDialTurns } from "@/lib/dial-turns";

/* The server cannot know the stored theme, so the first client render must
   match the server's. Reading it as an external store gives false on the
   server and true after hydration without a state write in an effect. */
const noop = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * Three states, three targets — light, dark, and system as separate controls
 * rather than one button that cycles. A cycling toggle hides where you are and
 * makes "follow the system" unreachable without guessing.
 */
const MODES = [
  {
    value: "light",
    label: "Light",
    path: (
      <>
        <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M8 1.4v1.4M8 13.2v1.4M14.6 8h-1.4M2.8 8H1.4M12.66 3.34l-1 1M4.34 11.66l-1 1M12.66 12.66l-1-1M4.34 4.34l-1-1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    path: (
      <path
        d="M13.4 9.6A5.6 5.6 0 0 1 6.4 2.6a6.1 6.1 0 1 0 7 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    value: "system",
    label: "System",
    path: (
      <>
        <rect
          x="1.9"
          y="3"
          width="12.2"
          height="8.4"
          rx="1.1"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M5.6 13.6h4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
] as const;

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
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              {mode.path}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
