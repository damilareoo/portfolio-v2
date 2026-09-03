// components/instrument-bank.tsx
"use client";

import { useEffect, useState } from "react";
import { ClockFace } from "@/components/clock-face";
import { Pedometer } from "@/components/glyph-bay";
import { InstrumentReading } from "@/components/instrument-card";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { WeatherFace } from "@/components/weather-face";
import { clockReading } from "@/lib/clock";
import { Reveal } from "@/lib/reveal";
import { useWeather } from "@/lib/use-weather";

/**
 * Every reading the site takes, in one grid.
 *
 * What this replaces: a large disc, a medium card, a small clock and a medium
 * weather face, split across two zones by a rule, at four sizes and on no
 * shared baseline. They read as widgets somebody collected. One card shape and
 * one grid make them a bank of instruments instead.
 *
 * Two columns is the floor. A single column of four cards is a list, and a list
 * of readings is the thing this is not.
 *
 * Four columns arrive at `sm`, not at `lg`. Measured: the two-column grid at
 * 768px gave 352px cells holding a 96px face — cells wider than the 286px the
 * four-up gets at 1440, and only two of them to a row. That is not restraint,
 * it is a bank laid out for a phone and left there; the reading drifted a
 * quarter of the screen from the face it belongs to. At 640 the four-up is
 * 136px a cell, which still clears the face by 40px.
 */
export function InstrumentBank({ className = "" }: { className?: string }) {
  const reading = useWeather();

  /* Null until mounted, and the reading prints its dash meanwhile — because at
     that moment the instrument genuinely does not know. The server cannot know
     the time either, and one time rendered there against another rendered here
     is a hydration mismatch. Ticked every second rather than every minute so
     the readout turns over *on* the minute; React drops the render when the
     string has not changed, which for 59 of every 60 ticks it has not. */
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(clockReading(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-bank
      className={`grid grid-cols-2 gap-[var(--pg-gap)] sm:grid-cols-4 ${className}`}
    >
      {/* The stagger is the law's "arriving" clause, once and never again. */}
      <Reveal index={0}>
        <InstrumentReading srLabel="Lagos" value={time ?? undefined}>
          <ClockFace />
        </InstrumentReading>
      </Reveal>

      <Reveal index={1}>
        <InstrumentReading
          srLabel="Weather"
          value={reading ? `${Math.round(reading.temperature)}°` : undefined}
        >
          <WeatherFace face={reading?.condition ?? "unreported"} />
        </InstrumentReading>
      </Reveal>

      <Reveal index={2}>
        <NowPlayingDisc />
      </Reveal>

      <Reveal index={3}>
        <Pedometer />
      </Reveal>
    </div>
  );
}
