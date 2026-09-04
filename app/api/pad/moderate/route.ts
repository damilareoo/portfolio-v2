import { NextResponse } from "next/server";
import { countersConfigured } from "@/lib/counters";
import { MAX_BODY_BYTES, removeEntry } from "@/lib/pad";
import { tokenMatches } from "@/lib/steps";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };

/** The scheme is case-insensitive per RFC 7235; the token is not. */
function bearerToken(request: Request): string {
  const match = /^bearer[ \t]+(.*)$/i.exec(request.headers.get("authorization") ?? "");
  return match ? match[1] : "";
}

/**
 * Take a drawing or a comment off the wall.
 *
 * A public write path without a way to unmake what lands on it is not a
 * finished feature, so this ships with it rather than after it. It is the same
 * shape as `/api/steps`: a bearer secret, checked constant-time by the same
 * `tokenMatches` — imported rather than copied, so the one place the site's
 * token comparison is written is the one place it is tested — and its *own*
 * secret, because the phone's ingest token and the owner's moderation token
 * should never be able to stand in for one another.
 *
 * Authentication comes first, before the body is read and before the store is
 * touched, so an unauthenticated caller learns nothing about either. An absent
 * or blank secret matches nothing: a deployment that has not been given one is
 * not a deployment anyone can delete from.
 */
export async function POST(request: Request) {
  if (!tokenMatches(bearerToken(request), process.env.PAD_MODERATION_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_CACHE });
  }

  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 413, headers: NO_CACHE });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too large" }, { status: 413, headers: NO_CACHE });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "unreadable" }, { status: 400, headers: NO_CACHE });
  }
  if (typeof parsed !== "object" || parsed === null) {
    return NextResponse.json({ error: "unreadable" }, { status: 400, headers: NO_CACHE });
  }

  const { kind, id } = parsed as { kind?: unknown; id?: unknown };
  if ((kind !== "drawing" && kind !== "comment") || typeof id !== "string" || id === "") {
    return NextResponse.json({ error: "unreadable" }, { status: 400, headers: NO_CACHE });
  }

  if (!countersConfigured) {
    return NextResponse.json(
      { error: "store not configured" },
      { status: 501, headers: NO_CACHE },
    );
  }

  /* Nothing removed is reported as nothing removed rather than as an error.
     The owner is deleting by an id read off the page, and "that entry is
     already gone" is a different answer from "the store would not answer" only
     to the store — from here they are indistinguishable, and claiming to know
     which would be a guess dressed as a status. */
  if (!(await removeEntry(kind, id))) {
    return NextResponse.json({ ok: false, removed: 0 }, { status: 404, headers: NO_CACHE });
  }

  return NextResponse.json({ ok: true, removed: 1 }, { headers: NO_CACHE });
}
