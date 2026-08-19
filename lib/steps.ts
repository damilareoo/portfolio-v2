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

import { createHash, timingSafeEqual } from "node:crypto";
import { countersConfigured } from "@/lib/counters";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * A null total is a day nobody reported — the phone was off, in Doze, or the
 * bearer was mid-rotation. It is not a day of no walking, and the two must
 * stay distinguishable all the way to the card, which paints an unreported day
 * as placeholder dots rather than as an empty ring.
 */
export type StepsDay = { date: string; steps: number | null };

export type StepsReading = {
  today: number | null;
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
/**
 * What a posted body turns out to be saying.
 *
 * "Nothing" is a first-class answer, not a failure. The only client this
 * endpoint has is a macro on a phone, and the commonest thing a macro does is
 * fire with its step variable never set — Tasker substitutes the literal
 * `%steps`, MacroDroid leaves a hole. Both produce a body with no number in it,
 * and both mean the same thing: there is nothing to report right now.
 *
 * Treating that as an error pushed the problem onto the phone, where it had to
 * be solved with a guard condition on the macro — and a guard written slightly
 * wrong fails silently and forever. It is answered here instead, so the macro
 * can be one action with nothing clever attached to it.
 */
export type Ingest =
  | { kind: "nothing" }
  | { kind: "bad-date" }
  | { kind: "reading"; steps: number; date?: string }
  | { kind: "segments"; segments: StepSegment[] };

/**
 * One Health Connect step record: a count, and when it started.
 *
 * The start is kept as the string it arrived as, because it is also the
 * identity of the record in the store — the thing that makes a second delivery
 * of the same record an overwrite rather than another few hundred steps.
 */
export type StepSegment = { start: string; count: number };

/** A finite number, or null — from a JSON number or a string holding one. */
function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Read a posted body, in any of the shapes a phone might send it.
 *
 * `{"steps": 6231}` is the documented form and still the one to write. A bare
 * `6231` works too, because an automation app that can only send a variable and
 * no template around it should not be locked out of an endpoint this simple.
 *
 * A malformed date is the one shape that still fails loudly: it is a body that
 * knows what it wants to say and has said it wrong, which is a different thing
 * from a body with nothing to say.
 */
export function readIngest(raw: string): Ingest {
  const text = raw.trim();
  if (text === "") return { kind: "nothing" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Not JSON at all — an unset variable, or a body that is only a number.
    const bare = asNumber(text);
    return bare === null ? { kind: "nothing" } : { kind: "reading", steps: bare };
  }

  if (typeof parsed === "object" && parsed !== null) {
    const { steps, date } = parsed as { steps?: unknown; date?: unknown };
    if (date !== undefined && (typeof date !== "string" || !DATE_PATTERN.test(date))) {
      return { kind: "bad-date" };
    }

    /* The webhook apps post Health Connect's own records rather than a total.
       A record missing either half of its identity is dropped rather than
       guessed at, and dropping one is not grounds for refusing the rest — a
       batch is a sync's worth of a day, and losing all of it over one bad row
       would lose real walking. */
    if (Array.isArray(steps)) {
      const segments: StepSegment[] = [];
      for (const record of steps) {
        if (typeof record !== "object" || record === null) continue;
        const { count, start_time: start } = record as { count?: unknown; start_time?: unknown };
        const value = asNumber(count);
        if (value === null || value < 0) continue;
        if (typeof start !== "string" || Number.isNaN(Date.parse(start))) continue;
        segments.push({ start, count: value });
      }
      return segments.length === 0 ? { kind: "nothing" } : { kind: "segments", segments };
    }

    const value = asNumber(steps);
    if (value === null) return { kind: "nothing" };
    return date === undefined
      ? { kind: "reading", steps: value }
      : { kind: "reading", steps: value, date: date as string };
  }

  const value = asNumber(parsed);
  return value === null ? { kind: "nothing" } : { kind: "reading", steps: value };
}

export function isPlausible(prev: number | null, next: number): boolean {
  if (typeof next !== "number" || !Number.isFinite(next)) return false;
  if (next < 0 || next > STEP_CEILING) return false;
  if (prev !== null && next < prev) return false;
  return true;
}

/**
 * The whole of the ingest's security, kept out of the route so it can be
 * tested directly. An absent or blank secret matches nothing: a deployment
 * that has not been given one yet must not be a deployment anyone can write
 * steps into.
 *
 * Both sides are hashed first. Digests are always thirty-two bytes, so
 * timingSafeEqual — which throws on buffers of unequal size — can never throw,
 * and the comparison stays constant-time with respect to the secret without a
 * length guard that would answer short tokens faster than long ones.
 */
export function tokenMatches(offered: string, secret: string | undefined): boolean {
  // Trimmed on both sides: a secret pasted into Vercel with a trailing newline
  // would otherwise be unmatchable by a token typed correctly on the phone.
  const expected = (secret ?? "").trim();
  if (!expected) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(offered.trim()), digest(expected));
}

/** Averaged over reported days only, so a silent phone cannot deflate the week. */
export function averageOf(days: StepsDay[]): number {
  const reported = days.filter((day) => day.steps !== null);
  if (reported.length === 0) return 0;
  const total = reported.reduce((sum, day) => sum + (day.steps ?? 0), 0);
  return Math.round(total / reported.length);
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

  const days = dates.map((date, i) => ({ date, steps: toCount(values[i]) }));

  return {
    // Null until the first post of the morning. Every day begins unreported,
    // and a card that showed 0 / 10000 at 6am would be stating a fact nobody
    // has established yet.
    today: days[days.length - 1]?.steps ?? null,
    days,
    average7: averageOf(days),
    updatedAt: toCount(updated),
    goal,
  };
}

/** Where a day's individual records live, keyed by the moment each began. */
export function segmentsKey(date: string): string {
  return `steps:seg:${date}`;
}

/**
 * File a batch of records and rebuild the days they touched.
 *
 * The apps that post these sync incrementally — each run carries only what is
 * new since the last — so a day's total has to be accumulated rather than
 * replaced. Keeping the records themselves is what makes that safe: a second
 * delivery of a record overwrites its own field instead of adding to a running
 * sum, and a corrected record can revise a day *downwards*, which the plain
 * total's keep-the-peak rule can never do.
 *
 * A record is filed under the day it began in Lagos. One that runs across
 * midnight lands wholly on the day it started, which is a rounding error of a
 * few minutes' walking and not worth splitting a record to avoid.
 */
export async function writeSegments(segments: StepSegment[]): Promise<boolean> {
  const byDay = new Map<string, StepSegment[]>();
  for (const segment of segments) {
    const date = zonedDate(new Date(segment.start));
    const day = byDay.get(date);
    if (day) day.push(segment);
    else byDay.set(date, [segment]);
  }

  for (const [date, day] of byDay) {
    const fields: (string | number)[] = [];
    for (const segment of day) fields.push(segment.start, segment.count);
    if (await command(["HSET", segmentsKey(date), ...fields]) === null) return false;
    // The hash ages out on the same sixty days as the total it feeds.
    await command(["EXPIRE", segmentsKey(date), DAY_TTL_SECONDS]);

    const stored = await command(["HVALS", segmentsKey(date)]);
    if (!Array.isArray(stored)) return false;
    let total = 0;
    for (const value of stored) {
      const n = Number(value);
      if (Number.isFinite(n)) total += n;
    }
    if (!(await writeSteps(date, Math.round(total)))) return false;
  }
  return true;
}

export async function writeSteps(date: string, steps: number): Promise<boolean> {
  // SET with EX is one round trip and atomic. A separate EXPIRE could fail on
  // its own and leave a key that never ages out of the store.
  const set = await command(["SET", stepsKey(date), steps, "EX", DAY_TTL_SECONDS]);
  if (set === null) return false;

  // Only a post about today moves the freshness mark. A backfill is new
  // history, not new news; letting it touch the mark would have the card claim
  // a month-old number had been read a minute ago.
  if (date === zonedDate()) await command(["SET", UPDATED_AT_KEY, Date.now()]);
  return true;
}
