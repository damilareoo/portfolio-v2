// components/clock-face.tsx
"use client";

import { useEffect, useState } from "react";
import { handAngles, type Hands } from "@/lib/clock";

/**
 * An analogue face for Lagos.
 *
 * Hands rather than digits: the site already says the time in dot-matrix
 * numerals in the footer bay, and a second numeric readout would be the same
 * sentence twice. It reports live external state, which is the one clause of
 * Law 4 that admits continuous motion — and it moves only while it is telling
 * the time.
 *
 * Null until mounted. The server cannot know the time, and rendering one time
 * on the server and another on the client is a hydration mismatch.
 */
export function ClockFace({ size = 64 }: { size?: number }) {
  const [hands, setHands] = useState<Hands | null>(null);

  useEffect(() => {
    const tick = () => setHands(handAngles(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Lagos time"
      className="shrink-0"
    >
      <circle cx="50" cy="50" r="50" className="fill-strong" />
      {/* The reference carries a red dot here. This site admits one hue, and it
          means a day the step goal was missed; a second meaning would be a
          second hue in all but name. So it is drawn in the face's own ink. */}
      <circle cx="26" cy="26" r="4" className="fill-on-strong" opacity="0.5" />
      {hands && (
        <>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="26"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-on-strong"
            transform={`rotate(${hands.hour} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="16"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-on-strong"
            opacity="0.6"
            transform={`rotate(${hands.minute} 50 50)`}
          />
        </>
      )}
    </svg>
  );
}
