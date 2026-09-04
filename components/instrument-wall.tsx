// components/instrument-wall.tsx
"use client";

import { useEffect, useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { Pedometer } from "@/components/glyph-bay";
import { InstrumentReading } from "@/components/instrument-card";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { WeatherFace } from "@/components/weather-face";
import { clockReading, everySecond } from "@/lib/clock";
import { Reveal } from "@/lib/reveal";
import { useWeather } from "@/lib/use-weather";

/**
 * The readings are the footer.
 *
 * What this replaces: four bordered cards, small, floating in a row under a
 * rule with a link row beside them and a version pill on the end — four things
 * competing at the bottom of the page and none of them large enough to be the
 * reason you looked. The verdict on it was "chaotic", and it was: every element
 * down there had its own edge, so nothing had precedence.
 *
 * So the readings stop being objects on the page and become the page's own
 * instrument panel. They are flush — no gap between them — and span the whole
 * measure, and the only thing between one and the next is a hairline. Nothing
 * else is down there but one quiet line of links beneath, which is the caller's
 * business, not this component's.
 *
 * Two rules govern where a line is drawn, and they are the site's own:
 *
 *   - The panel's outer edge is the page's rule. `rule-t` is the dotted pixel
 *     rule the rest of the site separates bands with, drawn on the wall's own
 *     top edge so the panel begins exactly where the page says it does. The
 *     bottom edge is the quiet line's `rule-t` — the same pixel, drawn once,
 *     by whichever element is below.
 *   - The panel's internal divisions are hairlines. `globals.css` puts it as
 *     "a border that separates is a mark; a border that contains is an edge" —
 *     and these contain. Each bay is a compartment of one panel, not a band of
 *     the page, so it gets the containment hairline, not the dotted rule.
 *
 * No ink lands on the outside of the outermost bays. A box around the wall
 * would make it an object sitting on the page again, which is the whole defect.
 * The borders are still there — see `EDGES` for why — just drawn in nothing.
 *
 * Two columns is the floor. A single column of four readings is a list, and a
 * list of readings is the thing this is not. Four columns arrive at `sm`, not
 * at `lg` — measured before the faces were made fluid, the two-column grid at
 * 768px gave 352px cells holding a 96px face, which is a bank laid out for a
 * phone and left there.
 */

/* The inset a reading stands in, and therefore how large its face is drawn:
   the face takes the cell minus this, on both axes. Tighter on a phone, where
   the cell is ~140px and every pixel of face is worth having; wider from `sm`,
   where the cell runs to ~298px and the face would otherwise crowd the
   hairline it sits beside. This is also the wall's only gap — two bays' worth
   of it, back to back, with the hairline in the middle. */
const BAY = "p-4 sm:p-6";

/* Every bay draws a line up its left side and along its top — see the wall's
   own `*:border-t *:border-l` — and this says which of those lines is inked and
   which is left in nothing, per bay, in each of the two layouts.

   Drawn and then hidden, rather than simply not drawn, because a border is part
   of the box: a bay missing one is a pixel wider than its neighbours, and at
   four-up that made the first face 250px against the others' 249 and stood its
   value one pixel below the rest of the row. One pixel is nothing to look at
   and everything to a wall whose whole claim is that four readings share a
   baseline. Every bay carries the same two borders now, and the ones that land
   on the panel's outside carry them in transparent.

   Written out per bay rather than derived with `nth-child`, because the grid
   rewraps: at two columns the third reading starts a new row and wants ink
   above it and nothing to its left, and at four columns it wants exactly the
   opposite. `divide-x` cannot express that at all — it would run a stray
   hairline down the outside of the second bay on a phone and draw nothing
   between the two rows. */
const EDGES = [
  /* First of the row in both layouts: the page is on two sides of it. */
  "border-l-transparent border-t-transparent",
  /* Beside it in both. */
  "border-l-line border-t-transparent",
  /* Below the first at two columns, third along at four. */
  "border-l-transparent border-t-line sm:border-l-line sm:border-t-transparent",
  /* The far corner at two columns, last along at four. */
  "border-l-line border-t-line sm:border-t-transparent",
];

/**
 * The Lagos bay, and the one thing on this wall that changes on its own.
 *
 * It is a component rather than a `useState` in the wall for one reason: the
 * reading carries seconds now, so every tick changes the string. Before, 59 of
 * every 60 ticks set the same value and React threw the render away; held in
 * the wall, the new reading would re-render all four bays every second to
 * change eight characters in one of them. Nothing would move that should not —
 * a diff is not a paint — but a wall that re-renders itself once a second to
 * report the time is a thing to be able to point at and say why, and the
 * cheaper answer is for the bay that ticks to be the only bay that renders.
 *
 * Null until mounted, and the reading prints its dash meanwhile — because at
 * that moment the instrument genuinely does not know. The server cannot know
 * the time either, and one time rendered there against another rendered here
 * is a hydration mismatch.
 *
 * `everySecond` rather than an interval, so the digits turn over on the second
 * they name — beside a hand doing the same, on the same schedule, for the same
 * reason. See its docblock for what the interval was getting wrong.
 */
function LagosReading() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => everySecond(() => setTime(clockReading(new Date()))), []);

  return (
    <InstrumentReading srLabel="Lagos" value={time ?? undefined}>
      <ClockFace />
    </InstrumentReading>
  );
}

export function InstrumentWall({ className = "" }: { className?: string }) {
  const reading = useWeather();

  return (
    <div
      data-wall
      /* Every bay gets the same two hairlines; `EDGES` decides which of them are
         inked. The widths live here so that no bay can end up a pixel out of
         step with the rest, and the colour lives there because it is the only
         part of the line that differs between one bay and the next. */
      className={`rule-t grid grid-cols-2 *:border-t *:border-l sm:grid-cols-4 ${className}`}
    >
      {/* The stagger is the law's "arriving" clause, once and never again: the
          panel assembles itself left to right the first time it is seen, and is
          thereafter a still picture of itself. */}
      <Reveal index={0} className={`${BAY} ${EDGES[0]}`}>
        <LagosReading />
      </Reveal>

      <Reveal index={1} className={`${BAY} ${EDGES[1]}`}>
        <InstrumentReading
          srLabel="Weather"
          value={reading ? `${Math.round(reading.temperature)}°` : undefined}
        >
          <WeatherFace face={reading?.condition ?? "unreported"} />
        </InstrumentReading>
      </Reveal>

      <Reveal index={2} className={`${BAY} ${EDGES[2]}`}>
        <NowPlayingDisc />
      </Reveal>

      <Reveal index={3} className={`${BAY} ${EDGES[3]}`}>
        <Pedometer />
      </Reveal>
    </div>
  );
}
