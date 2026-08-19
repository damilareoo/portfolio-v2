import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { countersConfigured } from "@/lib/counters";
import {
  isPlausible,
  readDay,
  readIngest,
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
 *
 * The body is read leniently on purpose — see `readIngest`. A phone with
 * nothing to say is the ordinary case, not an error, and answering it as one
 * moved the complexity onto the phone, where it could fail silently.
 */
export async function POST(request: Request) {
  if (!tokenMatches(bearerToken(request), process.env.STEPS_INGEST_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_CACHE });
  }

  const ingest = readIngest(await request.text());

  if (ingest.kind === "bad-date") {
    return NextResponse.json({ error: "bad date" }, { status: 422, headers: NO_CACHE });
  }

  /* Nothing to report is not a failure, and answering it as one would push the
     problem back onto the phone — where the only fix is a guard on the macro,
     and a guard written slightly wrong fails silently for months. 204 says the
     post was heard and carried no reading. The store is not touched. */
  if (ingest.kind === "nothing") {
    return new NextResponse(null, { status: 204, headers: NO_CACHE });
  }

  const date = ingest.date ?? zonedDate();

  // Rounded before the check so that a float total cannot pass validation and
  // then be stored as a different number.
  const steps = Math.round(ingest.steps);

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
