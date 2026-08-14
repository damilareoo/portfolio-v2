import { NextResponse } from "next/server";
import {
  DIAL_TURNS_KEY,
  bumpCount,
  countersConfigured,
  readCount,
  withinRateLimit,
} from "@/lib/counters";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  const count = await readCount(DIAL_TURNS_KEY);
  return NextResponse.json({ count, live: countersConfigured }, { headers: NO_CACHE });
}

export async function POST(request: Request) {
  if (!countersConfigured) {
    return NextResponse.json({ count: null, live: false }, { headers: NO_CACHE });
  }

  // x-forwarded-for is a list; the client is the first entry.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!(await withinRateLimit(ip))) {
    // The visitor keeps their local count; the shared one simply stops moving.
    const count = await readCount(DIAL_TURNS_KEY);
    return NextResponse.json({ count, live: true, limited: true }, { headers: NO_CACHE });
  }

  const count = await bumpCount(DIAL_TURNS_KEY);
  return NextResponse.json({ count, live: true }, { headers: NO_CACHE });
}
