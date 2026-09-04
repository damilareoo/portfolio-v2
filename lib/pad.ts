/**
 * The sketchpad's register: what visitors drew, and what they said.
 *
 * Two lists live in the same Upstash Redis the counters and the steps use,
 * reached the same way they reach it — the REST API, no SDK, no client object.
 * `lib/counters.ts` is the pattern and `lib/steps.ts` is the precedent for
 * re-declaring `command` rather than importing it: each module owns the shape
 * of what it stores, and one transport helper shared across three of them would
 * make a change to any one of them a change to all three.
 *
 * Unlike a counter, this is not decoration. A read that fails degrades to
 * nothing on the page, as everything here does; a *write* that fails is told
 * about, because a visitor who drew something and was answered with silence
 * has been lied to.
 */

import { createHash, randomBytes } from "node:crypto";
import { countersConfigured } from "@/lib/counters";
import { type Comment, type Drawing, type Register, decodeCells } from "@/lib/pad-field";

/* The field travels with the register. A route validating a post and a
   component drawing one both reach for this module; only the browser reaches
   past it, straight to lib/pad-field, so that node:crypto stays on the server. */
export * from "@/lib/pad-field";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/* ---- who is asking ----------------------------------------------------- */

/**
 * The address the request arrived from, as the proxy in front reports it.
 *
 * This value never leaves this module in the shape it arrives in. It exists to
 * be hashed, and the hash is the only thing written anywhere.
 */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

/**
 * A client's identity for rate-limiting purposes, and for nothing else.
 *
 * Salted, because an unsalted hash of an IPv4 address is not an anonymisation:
 * the whole space is four billion values and a laptop walks it in seconds. The
 * salt is a secret held in the environment and never written into the source —
 * a default salt in a public repository is the same as no salt at all.
 *
 * A missing salt returns null and both write paths refuse. Fail-closed on
 * purpose: the alternatives are storing something that identifies a visitor, or
 * running with no rate limit, and both are worse than the feature staying off
 * until the owner sets one variable.
 *
 * Truncated to twenty-four hex characters — ninety-six bits, far past any
 * collision that matters at this traffic, and a shorter key.
 */
export function clientHash(address: string, salt: string | undefined): string | null {
  const key = (salt ?? "").trim();
  if (!key) return null;
  /* An address the proxy did not report buckets everyone together under one
     name. That is the strict reading rather than the lax one: a client that
     cannot be told apart shares the tightest budget instead of escaping it. */
  const subject = address || "unknown";
  return createHash("sha256").update(`${key}:${subject}`).digest("hex").slice(0, 24);
}

export function newId(): string {
  return randomBytes(8).toString("hex");
}

/**
 * How much of the register the page carries.
 *
 * Forty drawings and thirty comments. The wall is the expensive half — each
 * drawing is its own canvas, so forty of them is 5760 cells, which is a
 * fraction of what one shots panel already paints and, unlike that one, is
 * painted once and then left still. Thirty comments is a page of reading.
 *
 * Both are the *newest* N. A register is a wall you walk past, not an archive,
 * and anything older than the wall has been walked past already.
 */
export const REGISTER_SIZE = 40;
export const COMMENTS_SIZE = 30;

/**
 * The largest body either write path will look at.
 *
 * A drawing is 36 characters and a comment is 500, so a kilobyte of slack over
 * the largest honest post is generous. The cap exists so a body is refused on
 * its size before anything tries to parse it — a megabyte of JSON is an attack
 * on the parser, and the parser is the first thing a route would otherwise run.
 */
export const MAX_BODY_BYTES = 2048;

/* ---- the store --------------------------------------------------------- */

export const DRAWINGS_KEY = "pad:drawings";
export const COMMENTS_KEY = "pad:comments";

/** Where a rate-limit window is counted. Its own prefix under `pad:`, so it can
    never be mistaken for a day of walking under `steps:` or the counters' own
    `rate:` tally. */
export function padRateKey(name: string, client: string, window: number): string {
  return `pad:rate:${name}:${client}:${window}`;
}

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
    // A register that cannot be read is an empty wall, not a broken page.
    return null;
  }
}

/* ---- the rate limit ---------------------------------------------------- */

export type Budget = { name: string; limit: number; windowSeconds: number };

/** Enough for a visitor who draws, looks at it, and draws a better one. */
export const DRAWING_BUDGET: Budget = { name: "draw", limit: 5, windowSeconds: 600 };

/** Tighter, because a comment is the half of this that can carry a payload. */
export const COMMENT_BUDGET: Budget = { name: "say", limit: 3, windowSeconds: 600 };

/**
 * A fixed window per client per path, counted in the store itself.
 *
 * INCR plus EXPIRE, which is the shape `lib/counters.ts` already uses and the
 * only shape available without a dependency. Fixed rather than sliding: at the
 * traffic a personal site sees, the worst a fixed window admits is a double
 * burst across a boundary, and a double burst of five drawings is five
 * drawings.
 *
 * The expiry is set only on the call that created the key, and is longer than
 * the window it guards, so a window counted right at its own edge still ages
 * out rather than living forever.
 *
 * A store that will not answer refuses the write. There is nowhere to put the
 * drawing in that case anyway, and answering "unlimited" the moment the store
 * goes quiet would be a rate limit that turns itself off under load.
 */
export async function withinBudget(budget: Budget, client: string): Promise<boolean> {
  if (!countersConfigured) return false;
  const window = Math.floor(Date.now() / (budget.windowSeconds * 1000));
  const key = padRateKey(budget.name, client, window);
  const used = Number(await command(["INCR", key]));
  if (!Number.isFinite(used) || used <= 0) return false;
  if (used === 1) await command(["EXPIRE", key, Math.ceil(budget.windowSeconds * 1.5)]);
  return used <= budget.limit;
}

/* ---- reading and writing the register ---------------------------------- */

function readDrawing(value: unknown): Drawing | null {
  if (typeof value !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { id, cells, signature, at } = parsed as Record<string, unknown>;
  if (typeof id !== "string" || typeof cells !== "string") return null;
  // Read through the decoder rather than against a copy of its pattern, so a
  // field the pad could not draw can never come back off the wall.
  if (decodeCells(cells) === null) return null;
  if (typeof at !== "number" || !Number.isFinite(at)) return null;
  return { id, cells, signature: typeof signature === "string" ? signature : "", at };
}

function readComment(value: unknown): Comment | null {
  if (typeof value !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { id, body, name, at } = parsed as Record<string, unknown>;
  if (typeof id !== "string" || typeof body !== "string") return null;
  if (typeof at !== "number" || !Number.isFinite(at)) return null;
  return { id, body, name: typeof name === "string" ? name : "", at };
}

/**
 * The wall, newest first.
 *
 * Both lists are sorted sets scored by the moment the entry landed, which buys
 * three things a plain list does not: newest-first comes back in one command,
 * the trim that keeps the set bounded is one more, and a moderator removing an
 * entry removes exactly that member rather than the first value equal to it.
 *
 * Null means the register could not be read at all — no store, or a store that
 * would not answer. Distinguished from an empty register on purpose: "nobody
 * has drawn anything yet" and "the page cannot say" are different sentences.
 */
export async function readRegister(): Promise<Register | null> {
  if (!countersConfigured) return null;
  const [drawn, said] = await Promise.all([
    command(["ZRANGE", DRAWINGS_KEY, 0, REGISTER_SIZE - 1, "REV"]),
    command(["ZRANGE", COMMENTS_KEY, 0, COMMENTS_SIZE - 1, "REV"]),
  ]);
  if (!Array.isArray(drawn) || !Array.isArray(said)) return null;
  return {
    drawings: drawn.map(readDrawing).filter((entry): entry is Drawing => entry !== null),
    comments: said.map(readComment).filter((entry): entry is Comment => entry !== null),
  };
}

/**
 * File an entry and trim the set back to its cap in the same breath.
 *
 * The trim removes every rank below the newest N, so the set is bounded by the
 * write rather than by a sweep nobody would ever run. A failed trim is not a
 * failed write: the entry is in, and the next write trims what this one did not.
 */
async function file(key: string, cap: number, at: number, entry: object): Promise<boolean> {
  if ((await command(["ZADD", key, at, JSON.stringify(entry)])) === null) return false;
  await command(["ZREMRANGEBYRANK", key, 0, -(cap + 1)]);
  return true;
}

export function addDrawing(drawing: Drawing): Promise<boolean> {
  return file(DRAWINGS_KEY, REGISTER_SIZE, drawing.at, drawing);
}

export function addComment(comment: Comment): Promise<boolean> {
  return file(COMMENTS_KEY, COMMENTS_SIZE, comment.at, comment);
}

/**
 * Remove one entry by id, wherever in the set it sits.
 *
 * A sorted set removes by member, and the member is the whole JSON string — so
 * the set is read first to find the one carrying this id. Two round trips, for
 * an operation the owner performs by hand a handful of times a year, is the
 * right trade against an id-to-member index that could go stale.
 *
 * False means nothing was removed: no such id, or a store that would not
 * answer. The route says which by the status it returns.
 */
export async function removeEntry(kind: "drawing" | "comment", id: string): Promise<boolean> {
  const key = kind === "drawing" ? DRAWINGS_KEY : COMMENTS_KEY;
  const members = await command(["ZRANGE", key, 0, -1]);
  if (!Array.isArray(members)) return false;
  const read = kind === "drawing" ? readDrawing : readComment;
  for (const member of members) {
    if (read(member)?.id !== id) continue;
    return Number(await command(["ZREM", key, member as string])) > 0;
  }
  return false;
}
