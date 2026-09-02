// components/instrument-pair.tsx
"use client";

import { ClockFace } from "@/components/clock-face";
import { WeatherFace } from "@/components/weather-face";
import { useWeather } from "@/lib/use-weather";

/**
 * The two live readings, together.
 *
 * One component so the hero and the footer cannot drift apart: the page opens
 * and closes on the same instruments, which is what gives the footer a design
 * language rather than a second one invented for it. The reading behind it is
 * shared too — see lib/use-weather.ts — so two pairs on one page cannot show
 * two different temperatures.
 */
export function InstrumentPair({ size = 64 }: { size?: number }) {
  const reading = useWeather();

  return (
    <div className="flex items-center gap-4">
      <ClockFace size={size} />
      <div className="flex items-center gap-2">
        <WeatherFace face={reading?.condition ?? "unreported"} size={size} />
        <span className="font-mono text-xs uppercase tracking-wider text-ink-3 tabular-nums">
          {reading ? `${Math.round(reading.temperature)}°` : "—"}
        </span>
      </div>
    </div>
  );
}
