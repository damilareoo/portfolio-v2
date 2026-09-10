"use client";

import { useEffect, useState } from "react";
import { clockReading, everySecond } from "@/lib/clock";
import { useWeather } from "@/lib/use-weather";
import type { Condition } from "@/lib/weather";

/**
 * The two rows of the /about record that are still being read.
 *
 * A record of true fields typed once is a CV. What makes the sheet on /about a
 * record *being kept* is that two of its rows are answered live, from the same
 * two sources the footer's instruments read: the clock in `lib/clock.ts` and
 * the shared Lagos forecast in `lib/use-weather.ts`. Nothing new is fetched for
 * this page — the weather store is one reading per document, so the footer and
 * the record cannot disagree about the temperature.
 *
 * Law 4 covers both. Neither of these is an animation; they are the clause that
 * says an instrument reporting live external state may change what it says.
 *
 * Both start as null and print a dash, because at that moment the instrument
 * genuinely does not know. The server cannot know the time or the weather
 * either, and one answer rendered there against another rendered here is a
 * hydration mismatch.
 */

/** The dash a field prints while it has nothing to report. Never a zero. */
const UNREAD = "—";

export function LocalTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => everySecond(() => setTime(clockReading(new Date()))), []);

  return <span className="tabular-nums">{time ?? UNREAD}</span>;
}

/**
 * The six shapes the matrix can draw, said in words.
 *
 * `lib/weather.ts` reduces forty WMO codes to six because a 25-cell disc can
 * tell six of them apart. Written out here rather than there because these are
 * English for a reader, and that file's business is which picture a code maps
 * to — the same reason the tense of the standing sentence lives on the page and
 * not in `lib/experience.ts`.
 */
const SAID: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Storm",
  haze: "Haze",
};

export function WeatherReading() {
  const reading = useWeather();
  if (!reading) return <span>{UNREAD}</span>;

  return (
    <span>
      <span className="tabular-nums">{Math.round(reading.temperature)}&deg;</span>
      {", "}
      {SAID[reading.condition].toLowerCase()}
    </span>
  );
}
