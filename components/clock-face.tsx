// components/clock-face.tsx
"use client";

import { useEffect, useState } from "react";
import { everySecond, handAngles, type Hands } from "@/lib/clock";

/** Where the twelve index marks sit, and how loudly each one speaks.

    A face with nothing on it is only readable while the hands are apart. The
    moment they coincide — which they do for a couple of minutes every hour and
    five seconds — a bare disc has no frame left to read the pair against, so
    the marks are not decoration; they are the half of the instrument that does
    not move.

    Three weights, because twelve identical dots would leave the face
    four-fold symmetric and say nothing about which way is up. The twelve is
    the largest, the quarters next, and the eight between them are small enough
    to read as a ring rather than as eight more things to look at.

    They stand at 43 of the box's 50 units — clear of the minute hand's tip at
    36 and clear of the edge, so nothing on the face ever touches anything
    else. */
const INDEX_RADIUS = 43;
const INDEX = Array.from({ length: 12 }, (_, hour) => {
  const angle = (hour * Math.PI) / 6;
  const quarter = hour % 3 === 0;
  return {
    hour,
    cx: 50 + INDEX_RADIUS * Math.sin(angle),
    cy: 50 - INDEX_RADIUS * Math.cos(angle),
    r: hour === 0 ? 2.2 : quarter ? 1.6 : 0.9,
    opacity: hour === 0 ? 0.7 : quarter ? 0.5 : 0.28,
  };
});

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
      {/* The reference carries a red dot here, and this face used to carry its
          monochrome answer: one dot, at roughly ten o'clock, indexing nothing.
          A single mark on a clock is either the twelve or a mistake, and that
          one was neither. It is now the twelve, and it has eleven companions —
          see `INDEX`. The site admits one hue and it means a missed step goal,
          so all twelve are drawn in the face's own ink. */}
      {INDEX.map((mark) => (
        <circle
          key={mark.hour}
          cx={mark.cx}
          cy={mark.cy}
          r={mark.r}
          className="fill-on-strong"
          opacity={mark.opacity}
        />
      ))}
      {hands && (
        <>
          {/* The hour hand: short, broad, and the calmer of the two.

              It was the longest thing on the face after the seconds, drawn at
              full ink and half again as wide as the minute hand — which is the
              hierarchy inverted, and it cost the face the time. Hands coincide
              for a couple of minutes every hour and five seconds; with the hour
              hand both wider *and* brighter, the minute hand simply vanished
              inside it and the reading became a lozenge on a needle. Half of a
              sample of twelve times rendered that way.

              Two things now separate them, because either alone is a near miss.
              Length: this stops at 33 where the minute hand runs to 14, so the
              minute hand stands nineteen units proud of the hour hand's tip —
              more than the hour hand's own length, at any angle they can meet
              at. And value: the minute hand is drawn after this one and at full
              ink, so where they overlap the brighter mark is on top and the
              minute hand is legible along its whole length rather than only
              past the tip. Width alone was what was being asked to do this job,
              and width is the one signal an overlap destroys. */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="33"
            strokeWidth="6.5"
            strokeLinecap="round"
            className="stroke-on-strong"
            opacity="0.72"
            transform={`rotate(${hands.hour} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="14"
            strokeWidth="3.4"
            strokeLinecap="round"
            className="stroke-on-strong"
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
