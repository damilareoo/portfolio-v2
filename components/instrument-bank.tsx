// components/instrument-bank.tsx
"use client";

import { ClockFace } from "@/components/clock-face";
import { Pedometer } from "@/components/glyph-bay";
import { CARD_FACE, InstrumentCard } from "@/components/instrument-card";
import { NowPlayingDisc } from "@/components/now-playing-disc";
import { WeatherFace } from "@/components/weather-face";
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
 */
export function InstrumentBank({ className = "" }: { className?: string }) {
  const reading = useWeather();

  return (
    <div
      data-bank
      className={`grid grid-cols-2 gap-[var(--pg-gap)] lg:grid-cols-4 ${className}`}
    >
      {/* The stagger is the law's "arriving" clause, once and never again. */}
      <Reveal index={0}>
        <InstrumentCard label="Lagos" reading={undefined}>
          <ClockFace size={CARD_FACE} />
        </InstrumentCard>
      </Reveal>

      <Reveal index={1}>
        <InstrumentCard
          label="Weather"
          reading={reading ? `${Math.round(reading.temperature)}°` : undefined}
        >
          <WeatherFace face={reading?.condition ?? "unreported"} size={CARD_FACE} />
        </InstrumentCard>
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
