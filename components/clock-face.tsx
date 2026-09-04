// components/clock-face.tsx
"use client";

import { useEffect, useState } from "react";
import { everySecond, handAngles, type Hands } from "@/lib/clock";

/**
 * An analogue face for Lagos.
 *
 * Hands rather than digits: the site already says the time in dot-matrix
 * numerals in the footer bay, and a second numeric readout would be the same
 * sentence twice. It reports live external state, which is the one clause of
 * Law 4 that admits continuous motion — and it moves only while it is telling
 * the time.
 *
 * Three hands, and the third is the reason the other two are believable. With
 * only an hour and a minute hand the face changed once a minute, which at the
 * size it is drawn is indistinguishable from a drawing of a clock; the seconds
 * were being computed and then spent entirely on nudging the minute hand a
 * degree at a time. The second hand is where the instrument says out loud that
 * it is running.
 *
 * It steps rather than sweeps, and nothing here is animated: no transition, no
 * loop, no interpolation between two readings. So `prefers-reduced-motion` has
 * nothing to turn off — there is no journey to withhold, only a value that
 * changes, and withholding the value is what the site's reduced-motion rule
 * exists to prevent rather than to do.
 *
 * The tick is scheduled onto the second boundary by `everySecond` rather than
 * being run off an interval, so the hand moves *on* the second it names. See
 * that function for what a bare `setInterval` was getting wrong.
 *
 * Null until mounted. The server cannot know the time, and rendering one time
 * on the server and another on the client is a hydration mismatch.
 *
 * It takes no size. Everything here is drawn in the viewBox's own 100 units, so
 * the face fills whatever square it is handed and the hands scale with it —
 * which is what lets one reading stand in a narrow cell and a wide one without
 * the caller doing arithmetic on its behalf.
 */
export function ClockFace() {
  const [hands, setHands] = useState<Hands | null>(null);

  useEffect(() => everySecond(() => setHands(handAngles(new Date()))), []);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Lagos time"
      className="block h-full w-full"
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
          {/* The thinnest mark on the face and the longest, with a short tail
              behind the hub — which is what a second hand is, and also what
              keeps it from reading as a third minute hand. It is drawn last so
              it lies over the other two, and quietly, because it is the hand
              you notice moving rather than the hand you read the time off. */}
          <line
            x1="50"
            y1="60"
            x2="50"
            y2="11"
            strokeWidth="1.4"
            strokeLinecap="round"
            className="stroke-on-strong"
            opacity="0.55"
            transform={`rotate(${hands.second} 50 50)`}
          />
          {/* The pin, punched out of the hands in the face's own ground rather
              than laid on top of them in ink — a hub drawn in the same white
              as the hour hand would be invisible under a cap that is already
              wider than it. Three hands meeting at a bare point read as three
              lines crossing; this is what makes them one mechanism. */}
          <circle cx="50" cy="50" r="1.6" className="fill-strong" />
        </>
      )}
    </svg>
  );
}
