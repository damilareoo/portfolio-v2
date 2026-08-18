import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { countersConfigured } from "@/lib/counters";
import {
  DATE_PATTERN,
  isPlausible,
  readDay,
  readSteps,
  writeSteps,
  zonedDate,
} from "@/lib/steps";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };
const BEARER = "Bearer ";

/**
 * Both sides are hashed before the comparison. It is not the secret that needs
 * hiding — it is the length: timingSafeEqual throws on buffers of unequal size,
 * and the obvious guard against that would answer short tokens faster than long
 * ones. Digests are always thirty-two bytes, so every wrong token costs the
 * same.
 */
function authorized(request: Request): boolean {
  const secret = process.env.STEPS_INGEST_SECRET;
  // An unconfigured secret closes the route rather than opening it. This is the
  // whole of the ingest's security: a deployment that has not been given a
  // secret yet must not be a deployment anyone can write steps into.
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const offered = header.startsWith(BEARER) ? header.slice(BEARER.length).trim() : "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(offered), digest(secret));
}

export async function GET() {
  if (!countersConfigured) {
    return NextResponse.json({ configured: false }, { headers: NO_CACHE });
  }
  const reading = await readSteps(site.stepGoal);
  if (!reading) return NextResponse.json({ configured: false }, { headers: NO_CACHE });
  return NextResponse.json(reading, { headers: NO_CACHE });
}

/**
 * Health Connect is device-local and has no API to pull from, so the phone
 * posts here on a schedule instead. Every rejection is a plain status code with
 * no detail: the only client is a macro on the owner's phone, and anything else
 * knocking learns nothing from the answer.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_CACHE });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400, headers: NO_CACHE });
  }

  const { steps: raw, date: given } = (body ?? {}) as { steps?: unknown; date?: unknown };

  if (given !== undefined && (typeof given !== "string" || !DATE_PATTERN.test(given))) {
    return NextResponse.json({ error: "bad date" }, { status: 422, headers: NO_CACHE });
  }
  const date = given ?? zonedDate();

  // Rounded before the check so that a float total cannot pass validation and
  // then be stored as a different number.
  const steps = typeof raw === "number" ? Math.round(raw) : Number.NaN;

  const prev = await readDay(date);
  if (!isPlausible(prev, steps)) {
    return NextResponse.json({ error: "implausible" }, { status: 422, headers: NO_CACHE });
  }

  if (!(await writeSteps(date, steps))) {
    // The store, not the request, is at fault — the phone should try again.
    return NextResponse.json({ error: "store unavailable" }, { status: 503, headers: NO_CACHE });
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE });
}
