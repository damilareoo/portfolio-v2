import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { countersConfigured } from "@/lib/counters";
import {
  DATE_PATTERN,
  isPlausible,
  readDay,
  readSteps,
  tokenMatches,
  writeSteps,
  zonedDate,
} from "@/lib/steps";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };

/** The scheme is case-insensitive per RFC 7235; the token is not. */
function bearerToken(request: Request): string {
  const match = /^bearer[ \t]+(.*)$/i.exec(request.headers.get("authorization") ?? "");
  return match ? match[1] : "";
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
 * posts here on a schedule instead. Authentication comes first, before the
 * body is read and before the store is touched, so an unauthenticated caller
 * cannot use the endpoint to learn anything about either.
 *
 * Every rejection is a coarse status code with no detail. The only legitimate
 * client is a macro on the owner's phone, and anything else knocking learns
 * only which of five categories it fell into.
 */
export async function POST(request: Request) {
  if (!tokenMatches(bearerToken(request), process.env.STEPS_INGEST_SECRET)) {
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

  // Distinguished from a failed write on purpose: no store will ever be
  // reached on this deployment, so the phone should stop rather than retry
  // every half hour forever.
  if (!countersConfigured) {
    return NextResponse.json({ error: "store not configured" }, { status: 501, headers: NO_CACHE });
  }

  if (!(await writeSteps(date, steps))) {
    // The store, not the request, is at fault — the phone should try again.
    return NextResponse.json({ error: "store unavailable" }, { status: 503, headers: NO_CACHE });
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE });
}
