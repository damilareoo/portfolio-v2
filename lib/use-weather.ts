// lib/use-weather.ts
"use client";

import { useSyncExternalStore } from "react";
import { forecastUrl, readForecast, type Reading } from "@/lib/weather";
import { site } from "@/data/site";

/** Weather is not a thing that changes in a second. */
const REFRESH = 15 * 60 * 1000;

/**
 * The Lagos reading, or the admission that there isn't one.
 *
 * One reading for the whole document, not one per instrument. The page opens
 * and closes on the same two readings, which only means anything if they are
 * the same reading: with a fetch per hook the header and the footer asked
 * Open-Meteo twice on mount, and Open-Meteo rate-limits by IP — so the page
 * could open on 29° and close on an admission that it could not read, from one
 * mount, with nothing wrong. Held as an external store rather than in a
 * provider because the reading is genuinely external to React and the hook's
 * signature stays the caller's business — no consumer has to be wrapped in
 * anything to ask for the weather.
 *
 * A failure publishes null rather than leaving the last success standing. A
 * shared cache that held the old number would turn one throttled request into
 * every instrument on the page showing a stale reading as a current one, which
 * is the exact lie the unreported face exists to avoid.
 */
let reading: Reading | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: AbortController | null = null;

const listeners = new Set<() => void>();

function publish(next: Reading | null) {
  reading = next;
  listeners.forEach((listener) => listener());
}

async function read() {
  /* Only the newest request may publish. An interval firing over a slow request
     would otherwise let the older answer land last and win. */
  inFlight?.abort();
  const controller = new AbortController();
  inFlight = controller;

  try {
    const response = await fetch(forecastUrl(site.latitude, site.longitude), {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(String(response.status));
    const next = readForecast(await response.json());
    if (inFlight === controller) publish(next);
  } catch {
    /* Offline, refused, throttled, or nonsense in the payload all mean the
       same thing to an instrument: no reading. */
    if (inFlight === controller) publish(null);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    read();
    timer = setInterval(read, REFRESH);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    if (timer) clearInterval(timer);
    timer = null;
    inFlight?.abort();
    inFlight = null;
    /* Nothing is watching, so nothing is being kept fresh. The next instrument
       to mount must start from no reading rather than be handed one of unknown
       age to show as current. */
    reading = null;
  };
}

const getSnapshot = () => reading;

// The server has no forecast, and an instrument that guessed one would hydrate
// into a different page than it rendered.
const getServerSnapshot = (): Reading | null => null;

export function useWeather(): Reading | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
