import { NextResponse } from "next/server";
import {
  GLYPHS_DRAWN_KEY,
  bumpCount,
  countersConfigured,
  readCount,
  withinRateLimit,
} from "@/lib/counters";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  const count = await readCount(GLYPHS_DRAWN_KEY);
  return NextResponse.json({ count, live: countersConfigured }, { headers: NO_CACHE });
}

/**
 * A browser announcing that it has drawn its first glyph.
 *
 * The client only ever calls this once — it holds a flag of its own, so
 * redrawing does not inflate the number. The rate limit is here for the case
 * the client is not the one we shipped, which is every case worth defending
 * against; the count is a decoration, and a decoration nobody can run up.
 */
export async function POST(request: Request) {
  if (!countersConfigured) {
    return NextResponse.json({ count: null, live: false }, { headers: NO_CACHE });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!(await withinRateLimit(ip))) {
    const count = await readCount(GLYPHS_DRAWN_KEY);
    return NextResponse.json({ count, live: true, limited: true }, { headers: NO_CACHE });
  }

  const count = await bumpCount(GLYPHS_DRAWN_KEY);
  return NextResponse.json({ count, live: true }, { headers: NO_CACHE });
}
