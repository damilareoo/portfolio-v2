// app/api/pad/route.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The abuse surface, tested from the server end.
 *
 * Everything here is one claim: the controls are on the server. A client-side
 * `maxlength` is a courtesy to somebody typing, and this endpoint is reachable
 * with curl — so the caps, the limit and the salt are asserted against what the
 * route answers, never against what the form allows.
 *
 * The store is faked at the fetch boundary the way `lib/steps.test.ts` fakes it:
 * `command` is a single POST to the Upstash REST endpoint, so one stubbed global
 * covers the rate-limit counter and both write paths.
 */

const SALT = "test-salt";

/** A store that answers everything, and counts what it was asked. */
function fakeRedis() {
  const counters = new Map<string, number>();
  const calls: string[][] = [];

  const fetchImpl = vi.fn(async (_url: unknown, init: { body: string }) => {
    const args = (JSON.parse(init.body) as (string | number)[]).map(String);
    calls.push(args);
    let result: unknown = 1;
    if (args[0].toUpperCase() === "INCR") {
      const next = (counters.get(args[1]) ?? 0) + 1;
      counters.set(args[1], next);
      result = next;
    }
    return { ok: true, json: async () => ({ result }) };
  });

  return { counters, calls, fetchImpl };
}

async function loadRoute(options: { salt?: string; store?: boolean } = {}) {
  const { salt = SALT, store = true } = options;
  vi.resetModules();
  vi.stubEnv("KV_REST_API_URL", store ? "https://store.test" : "");
  vi.stubEnv("KV_REST_API_TOKEN", store ? "store-token" : "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("PAD_CLIENT_SALT", salt);
  const redis = fakeRedis();
  vi.stubGlobal("fetch", redis.fetchImpl);
  const { POST } = await import("./route");
  return { redis, POST };
}

/** One post, from one address, with a content-length the caller can lie about. */
function post(body: unknown, options: { ip?: string; length?: string } = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const headers = new Headers({
    "content-type": "application/json",
    "content-length": options.length ?? String(Buffer.byteLength(raw, "utf8")),
    "x-forwarded-for": options.ip ?? "203.0.113.7",
  });
  return { headers, text: async () => raw } as unknown as Request;
}

const A_DRAWING = "8".padEnd(36, "0");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("POST /api/pad, the happy path", () => {
  it("accepts a drawing and an anonymous signature", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "drawing", cells: A_DRAWING }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("accepts a comment", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "comment", body: "nice field", name: "Ada" }));
    expect(res.status).toBe(200);
  });

  it("never caches an answer about a write", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "drawing", cells: A_DRAWING }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("POST /api/pad, the length caps", () => {
  it("refuses a signature over twenty-four characters", async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      post({ kind: "drawing", cells: A_DRAWING, signature: "x".repeat(25) }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "signature too long" });
  });

  it("admits a signature of exactly twenty-four", async () => {
    const { POST } = await loadRoute();
    const res = await POST(
      post({ kind: "drawing", cells: A_DRAWING, signature: "x".repeat(24) }),
    );
    expect(res.status).toBe(200);
  });

  it("refuses a comment over five hundred characters", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "comment", body: "x".repeat(501) }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "comment too long" });
  });

  it("admits a comment of exactly five hundred", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "comment", body: "x".repeat(500) }))).status).toBe(200);
  });

  it("refuses a name over twenty-four characters", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "comment", body: "hi", name: "x".repeat(25) }));
    expect(res.status).toBe(422);
  });

  it("counts the cap in characters a person can see, not UTF-16 units", async () => {
    const { POST } = await loadRoute();
    // Twenty-four emoji are forty-eight UTF-16 units and twenty-four characters.
    // A cap counted in units would charge double for a signature that is
    // twenty-four characters wide on screen.
    const emoji = String.fromCodePoint(0x1f642).repeat(24);
    const res = await POST(post({ kind: "drawing", cells: A_DRAWING, signature: emoji }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/pad, the body cap", () => {
  it("refuses an oversized body on the length it declares, before reading it", async () => {
    const { POST } = await loadRoute();
    const request = post({ kind: "comment", body: "hi" }, { length: "1000000" });
    const read = vi.spyOn(request, "text");
    const res = await POST(request);
    expect(res.status).toBe(413);
    expect(read).not.toHaveBeenCalled();
  });

  it("refuses an oversized body that lied about its length, before parsing it", async () => {
    const { POST, redis } = await loadRoute();
    const res = await POST(post({ kind: "comment", body: "x".repeat(5000) }, { length: "10" }));
    expect(res.status).toBe(413);
    // Nothing reached the store, so an oversized body costs a round trip to
    // nobody but the sender.
    expect(redis.fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON at all, without touching the store", async () => {
    const { POST, redis } = await loadRoute();
    const res = await POST(post("not json"));
    expect(res.status).toBe(400);
    expect(redis.fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a post that is neither a drawing nor a comment", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "steps", steps: 6000 }))).status).toBe(400);
  });
});

describe("POST /api/pad, what a drawing has to be", () => {
  it("refuses a field that is not thirty-six hex characters", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "drawing", cells: "ff" }))).status).toBe(422);
    expect((await POST(post({ kind: "drawing", cells: "z".repeat(36) }))).status).toBe(422);
    expect((await POST(post({ kind: "drawing" }))).status).toBe(422);
  });

  it("refuses a field with nothing drawn on it", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "drawing", cells: "0".repeat(36) }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "nothing drawn" });
  });

  it("refuses an empty comment", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "comment", body: "   " }))).status).toBe(422);
  });
});

describe("POST /api/pad, the rate limit", () => {
  it("admits the budget and then rejects", async () => {
    const { POST } = await loadRoute();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await POST(post({ kind: "drawing", cells: A_DRAWING }))).status);
    }
    // Five drawings in ten minutes, then 429 for the rest of the window.
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429]);
  });

  it("holds comments to their own, tighter budget", async () => {
    const { POST } = await loadRoute();
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await POST(post({ kind: "comment", body: "hello" }))).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
  });

  it("spends the budget on a malformed post too, so garbage is not free", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) await POST(post({ kind: "drawing", cells: "nope" }));
    // The five refusals were still five attempts.
    expect((await POST(post({ kind: "drawing", cells: A_DRAWING }))).status).toBe(429);
  });

  it("does not let one visitor's flood close the pad for the next", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 6; i++) await POST(post({ kind: "drawing", cells: A_DRAWING }));
    const other = await POST(post({ kind: "drawing", cells: A_DRAWING }, { ip: "203.0.113.9" }));
    expect(other.status).toBe(200);
  });

  it("counts the first hop of the forwarded chain, not the proxy", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 6; i++) {
      await POST(post({ kind: "drawing", cells: A_DRAWING }, { ip: "203.0.113.7, 10.0.0.1" }));
    }
    // Same client, different proxy hop behind it.
    const again = await POST(
      post({ kind: "drawing", cells: A_DRAWING }, { ip: "203.0.113.7, 10.0.0.2" }),
    );
    expect(again.status).toBe(429);
  });
});

describe("POST /api/pad, what it will not run without", () => {
  it("writes nothing when there is no salt to hash an address with", async () => {
    const { POST, redis } = await loadRoute({ salt: "" });
    const res = await POST(post({ kind: "drawing", cells: A_DRAWING }));
    expect(res.status).toBe(501);
    expect(redis.fetchImpl).not.toHaveBeenCalled();
  });

  it("says so when there is no store, rather than pretending the drawing landed", async () => {
    const { POST } = await loadRoute({ store: false });
    expect((await POST(post({ kind: "drawing", cells: A_DRAWING }))).status).toBe(501);
  });

  it("reports a failed write rather than answering ok", async () => {
    vi.resetModules();
    vi.stubEnv("KV_REST_API_URL", "https://store.test");
    vi.stubEnv("KV_REST_API_TOKEN", "store-token");
    vi.stubEnv("PAD_CLIENT_SALT", SALT);
    let call = 0;
    vi.stubGlobal("fetch", async () => {
      call += 1;
      // The rate-limit INCR answers; the ZADD after it does not.
      return call === 1
        ? { ok: true, json: async () => ({ result: 1 }) }
        : { ok: false, json: async () => ({}) };
    });
    const { POST } = await import("./route");
    const res = await POST(post({ kind: "drawing", cells: A_DRAWING }));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/pad, what it stores about a visitor", () => {
  it("never writes the address it read", async () => {
    const { POST, redis } = await loadRoute();
    await POST(post({ kind: "comment", body: "hello", name: "Ada" }, { ip: "203.0.113.7" }));
    const written = JSON.stringify(redis.calls);
    expect(written).not.toContain("203.0.113.7");
    expect(written).not.toContain("user-agent");
    expect(written).not.toContain("referer");
    // What it does write: the text, the name, and a hash under `pad:`.
    expect(written).toContain("hello");
    expect(written).toContain("pad:rate:say:");
  });
});
