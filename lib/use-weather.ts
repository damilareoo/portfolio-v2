// lib/use-weather.ts
"use client";

import { useEffect, useState } from "react";
import { forecastUrl, readForecast, type Reading } from "@/lib/weather";
import { site } from "@/data/site";

/** Weather is not a thing that changes in a second. */
const REFRESH = 15 * 60 * 1000;

/**
 * The Lagos reading, or the admission that there isn't one.
 *
 * `settled` separates "still asking" from "asked and got nothing", because the
 * face draws the same unreported dots either way but should not claim a failure
 * it has not had yet.
 */
export function useWeather(): { reading: Reading | null; settled: boolean } {
  const [state, setState] = useState<{ reading: Reading | null; settled: boolean }>({
    reading: null,
    settled: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    const read = async () => {
      try {
        const response = await fetch(forecastUrl(site.latitude, site.longitude), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const reading = readForecast(await response.json());
        if (live) setState({ reading, settled: true });
      } catch {
        /* Offline, refused, throttled, or nonsense in the payload all mean the
           same thing to an instrument: no reading. */
        if (live) setState({ reading: null, settled: true });
      }
    };

    read();
    const id = setInterval(read, REFRESH);
    return () => {
      live = false;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  return state;
}
