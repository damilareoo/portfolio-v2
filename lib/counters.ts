/**
 * Counters that outlive a visit.
 *
 * The store is reached through this one module so it can be swapped or absent
 * without the UI knowing. Every function returns null when no store is
 * configured, and the components render placeholder digits rather than zero —
 * a counter that has never been read is not a counter at zero.
 *
 * Backed by Upstash Redis over its REST API. The Vercel marketplace
 * integration injects KV_REST_API_*; a hand-rolled Upstash project injects
 * UPSTASH_REDIS_REST_*. Both are accepted.
 *
 * The dial-turn counter was this module's only reader of a key and it is gone
 * with the dial. What is left is the store adapter itself, and it is kept
 * whole rather than reduced to `countersConfigured` — which the steps card
 * asks, and which is a statement about a store that can be read and written.
 * `DIAL_TURNS_KEY` went because it named one dial; nothing else here named it.
 */

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const countersConfigured = Boolean(url && token);

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
    // A counter is decoration on top of the page, never a reason to fail it.
    return null;
  }
}

function toCount(result: unknown): number | null {
  const n = typeof result === "string" ? Number(result) : result;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export async function readCount(key: string): Promise<number | null> {
  return toCount(await command(["GET", key]));
}

export async function bumpCount(key: string): Promise<number | null> {
  return toCount(await command(["INCR", key]));
}

/**
 * A rolling per-minute allowance, so one visitor holding a dial down cannot
 * define the number everyone else sees. Generous enough that honest play with
 * the dials never hits it.
 */
const LIMIT_PER_MINUTE = 60;

export async function withinRateLimit(ip: string): Promise<boolean> {
  if (!countersConfigured) return false;
  const key = `rate:${ip}:${Math.floor(Date.now() / 60_000)}`;
  const used = toCount(await command(["INCR", key]));
  if (used === null) return false;
  if (used === 1) await command(["EXPIRE", key, 90]);
  return used <= LIMIT_PER_MINUTE;
}
