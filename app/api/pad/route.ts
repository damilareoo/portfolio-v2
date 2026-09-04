import { NextResponse } from "next/server";
import { countersConfigured } from "@/lib/counters";
import {
  COMMENT_BUDGET,
  COMMENT_MAX,
  DRAWING_BUDGET,
  MAX_BODY_BYTES,
  NAME_MAX,
  SIGNATURE_MAX,
  addComment,
  addDrawing,
  cleanText,
  clientAddress,
  clientHash,
  decodeCells,
  hasMark,
  newId,
  withinBudget,
  withinLength,
} from "@/lib/pad";

export const dynamic = "force-dynamic";

const NO_CACHE = { "Cache-Control": "no-store" };

const refuse = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: NO_CACHE });

/**
 * The colophon's one write path: a drawing, or a comment.
 *
 * This is the only endpoint on the site anybody may write to without a secret,
 * so the order of the checks below is the design rather than an accident. Size
 * first, because a body has to be small before anything looks at it. Then the
 * store and the salt, because a deployment missing either cannot honour a write
 * safely and should say so rather than half-doing one. Then the rate limit,
 * *before* the contents are judged, so that a flood of malformed posts spends
 * the same budget an honest one does. Only then the caps.
 *
 * A body that will not parse is turned away before the store is touched at all.
 * That is deliberate and is not a hole in the limit above it: the resource worth
 * protecting is the store, and a request refused here never reaches it.
 *
 * Nothing about the visitor is kept. The address is read, hashed with a salt
 * from the environment, and used as a key; no user agent, no referrer, and no
 * raw address is written anywhere.
 */
export async function POST(request: Request) {
  /* Refused on its declared size before the body is read, and on its real size
     before it is parsed — a content-length header is a claim, not a fact. */
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return refuse("too large", 413);
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return refuse("too large", 413);
  }

  if (!countersConfigured) return refuse("store not configured", 501);

  /* No salt, no writes. The alternatives are keeping something that identifies
     a visitor or running with no limit at all, and both are worse than the pad
     being read-only until the owner sets one variable. */
  const client = clientHash(clientAddress(request), process.env.PAD_CLIENT_SALT);
  if (!client) return refuse("moderation not configured", 501);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return refuse("unreadable", 400);
  }
  if (typeof parsed !== "object" || parsed === null) return refuse("unreadable", 400);

  const { kind } = parsed as { kind?: unknown };
  if (kind !== "drawing" && kind !== "comment") return refuse("unreadable", 400);

  const budget = kind === "drawing" ? DRAWING_BUDGET : COMMENT_BUDGET;
  if (!(await withinBudget(budget, client))) return refuse("too many", 429);

  const at = Date.now();

  if (kind === "drawing") {
    const { cells, signature } = parsed as { cells?: unknown; signature?: unknown };
    if (typeof cells !== "string" || decodeCells(cells) === null) {
      return refuse("not a drawing", 422);
    }
    // A field with nothing on it is a submit button pressed by accident.
    if (!hasMark(cells)) return refuse("nothing drawn", 422);

    const signed = signature === undefined ? "" : cleanText(signature);
    if (signed === null) return refuse("bad signature", 422);
    if (!withinLength(signed, SIGNATURE_MAX)) return refuse("signature too long", 422);

    if (!(await addDrawing({ id: newId(), cells, signature: signed, at }))) {
      return refuse("store unavailable", 503);
    }
    return NextResponse.json({ ok: true }, { headers: NO_CACHE });
  }

  const { body, name } = parsed as { body?: unknown; name?: unknown };
  const said = cleanText(body);
  if (said === null) return refuse("bad comment", 422);
  if (said === "") return refuse("nothing said", 422);
  if (!withinLength(said, COMMENT_MAX)) return refuse("comment too long", 422);

  const called = name === undefined ? "" : cleanText(name);
  if (called === null) return refuse("bad name", 422);
  if (!withinLength(called, NAME_MAX)) return refuse("name too long", 422);

  if (!(await addComment({ id: newId(), body: said, name: called, at }))) {
    return refuse("store unavailable", 503);
  }
  return NextResponse.json({ ok: true }, { headers: NO_CACHE });
}
