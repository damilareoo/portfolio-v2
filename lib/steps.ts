/**
 * A day's walking, kept one key per day.
 *
 * Health Connect lives on the phone and offers nothing to pull from, so the
 * direction is inverted: the phone posts here on a schedule and this module is
 * the only thing that touches the store. As with the counters, every read
 * degrades to null when the store is absent, unreachable, or misconfigured —
 * a readout is decoration on top of the page, never a reason to fail it.
 *
 * Backed by the same Upstash Redis the counters use, over its REST API. The
 * Vercel marketplace integration injects KV_REST_API_*; a hand-rolled Upstash
 * project injects UPSTASH_REDIS_REST_*. Both are accepted.
 */

import { countersConfigured } from "@/lib/counters";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export type StepsDay = { date: string; steps: number };

export type StepsReading = {
  today: number;
  days: StepsDay[];
  average7: number;
  updatedAt: number | null;
  goal: number;
};

/**
 * Roughly a hundred miles on foot. Nothing honest clears it, so anything that
 * does is a unit mix-up or a duplicated total upstream rather than a good day.
 */
export const STEP_CEILING = 200_000;

/** The card shows a week, and two months of history is enough to widen it later. */
const DAY_TTL_SECONDS = 5_184_000;

/** Written beside the day keys so the card can say how stale it is. */
const UPDATED_AT_KEY = "steps:updated-at";

/**
 * The site's stated coordinates are Lagos, so the day the card calls "today"
 * is the day the owner is walking through. UTC would roll the total over at
 * 1am local and show an empty card to someone still awake.
 */
const ZONE = "Africa/Lagos";

const dayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

async function command(args: (string | number)[]): Promise<unknown> {
  if (!countersConfigured) return null;
  try {
    const res = await fetch(url!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    return data.result ?? null;
  } catch {
    // A readout is decoration on top of the page, never a reason to fail it.
    return null;
  }
}

function toCount(result: unknown): number | null {
  const n = typeof result === "string" ? Number(result) : result;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export function stepsKey(date: string): string {
  return `steps:${date}`;
}

/** The calendar day the given instant falls on in Lagos, as YYYY-MM-DD. */
export function zonedDate(at: Date = new Date()): string {
  const parts = dayParts.formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function lastNDates(today: Date, n: number): string[] {
  // Anchoring the local day at UTC midnight makes the walk backwards exact
  // arithmetic; stepping the instant itself would drift under any zone that
  // observes daylight saving, even though Lagos does not.
  const anchor = Date.parse(`${zonedDate(today)}T00:00:00Z`);
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(new Date(anchor - i * 86_400_000).toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Steps only accumulate within a day, so a total lower than one already
 * recorded is a second device reporting, not a correction. Refusing it keeps
 * the card from walking backwards over the course of an afternoon.
 */
export function isPlausible(prev: number | null, next: number): boolean {
  if (typeof next !== "number" || !Number.isFinite(next)) return false;
  if (next < 0 || next > STEP_CEILING) return false;
  if (prev !== null && next < prev) return false;
  return true;
}

export function averageOf(days: StepsDay[]): number {
  if (days.length === 0) return 0;
  const total = days.reduce((sum, day) => sum + day.steps, 0);
  return Math.round(total / days.length);
}

export async function readDay(date: string): Promise<number | null> {
  return toCount(await command(["GET", stepsKey(date)]));
}

export async function readSteps(goal: number): Promise<StepsReading | null> {
  if (!countersConfigured) return null;

  const dates = lastNDates(new Date(), 7);
  const [values, updated] = await Promise.all([
    command(["MGET", ...dates.map(stepsKey)]),
    command(["GET", UPDATED_AT_KEY]),
  ]);
  if (!Array.isArray(values)) return null;

  // A day with no key is a day that was not reported; zero is the honest
  // reading for it, because the phone posts whether or not anyone walked.
  const days = dates.map((date, i) => ({ date, steps: toCount(values[i]) ?? 0 }));

  return {
    today: days[days.length - 1]?.steps ?? 0,
    days,
    average7: averageOf(days),
    updatedAt: toCount(updated),
    goal,
  };
}

export async function writeSteps(date: string, steps: number): Promise<boolean> {
  const key = stepsKey(date);
  if ((await command(["SET", key, steps])) === null) return false;
  await command(["EXPIRE", key, DAY_TTL_SECONDS]);
  await command(["SET", UPDATED_AT_KEY, Date.now()]);
  return true;
}
