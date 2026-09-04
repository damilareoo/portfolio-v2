// app/api/pad/moderate/route.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The way back off the wall.
 *
 * One rule, tested from the server end: nothing is removed by anybody who
 * cannot prove they are the owner, and proving it is the *first* thing that
 * happens — before the body is read and before the store is touched. A caller
 * with the wrong secret must not be able to learn whether an id exists by
 * timing the answer or by reading it.
 */

const SECRET = "moderation-secret";

/** A store holding one drawing and one comment, faked at the fetch boundary. */
function fakeRedis() {
  const sets = new Map<string, string[]>([
    [
      "pad:drawings",
      [JSON.stringify({ id: "d1", cells: "8".padEnd(36, "0"), signature: "", at: 1000 })],
    ],
    ["pad:comments", [JSON.stringify({ id: "c1", body: "hello", name: "", at: 1000 })]],
  ]);
  const calls: string[][] = [];

  const fetchImpl = vi.fn(async (_url: unknown, init: { body: string }) => {
    const args = (JSON.parse(init.body) as (string | number)[]).map(String);
    calls.push(args);
    const [cmd, key, ...rest] = args;
    let result: unknown = null;
    if (cmd.toUpperCase() === "ZRANGE") result = sets.get(key) ?? [];
    if (cmd.toUpperCase() === "ZREM") {
      const before = sets.get(key) ?? [];
      const after = before.filter((member) => member !== rest[0]);
      sets.set(key, after);
      result = before.length - after.length;
    }
    return { ok: true, json: async () => ({ result }) };
  });

  return { sets, calls, fetchImpl };
}

async function loadRoute(secret: string | undefined = SECRET) {
  vi.resetModules();
  vi.stubEnv("KV_REST_API_URL", "https://store.test");
  vi.stubEnv("KV_REST_API_TOKEN", "store-token");
  vi.stubEnv("PAD_MODERATION_SECRET", secret ?? "");
  const redis = fakeRedis();
  vi.stubGlobal("fetch", redis.fetchImpl);
  const { POST } = await import("./route");
  return { redis, POST };
}

function post(body: unknown, bearer?: string) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const headers = new Headers({
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(raw, "utf8")),
  });
  if (bearer !== undefined) headers.set("authorization", `Bearer ${bearer}`);
  return { headers, text: async () => raw } as unknown as Request;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("POST /api/pad/moderate, the secret", () => {
  it("refuses a wrong secret", async () => {
    const { POST, redis } = await loadRoute();
    const res = await POST(post({ kind: "drawing", id: "d1" }, "definitely-wrong"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    // Nothing was read and nothing was removed.
    expect(redis.fetchImpl).not.toHaveBeenCalled();
    expect(redis.sets.get("pad:drawings")).toHaveLength(1);
  });

  it("refuses a missing Authorization header", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "drawing", id: "d1" }))).status).toBe(401);
  });

  it("refuses a secret sent without the Bearer scheme", async () => {
    const { POST } = await loadRoute();
    const request = post({ kind: "drawing", id: "d1" });
    request.headers.set("authorization", SECRET);
    expect((await POST(request)).status).toBe(401);
  });

  it("refuses a prefix of the secret, and the secret with something after it", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "drawing", id: "d1" }, SECRET.slice(0, -1)))).status).toBe(401);
    expect((await POST(post({ kind: "drawing", id: "d1" }, `${SECRET}x`))).status).toBe(401);
  });

  it("refuses everybody when no secret is configured", async () => {
    // An unconfigured secret closes the route rather than opening it.
    const { POST } = await loadRoute("");
    expect((await POST(post({ kind: "drawing", id: "d1" }, ""))).status).toBe(401);
    expect((await POST(post({ kind: "drawing", id: "d1" }, SECRET))).status).toBe(401);
  });

  it("does not accept the steps ingest secret in its place", async () => {
    const { POST } = await loadRoute();
    vi.stubEnv("STEPS_INGEST_SECRET", "the-phone-token");
    expect((await POST(post({ kind: "drawing", id: "d1" }, "the-phone-token"))).status).toBe(401);
  });

  it("accepts the scheme in any case, and a token padded with whitespace", async () => {
    const { POST } = await loadRoute();
    const request = post({ kind: "drawing", id: "d1" });
    request.headers.set("authorization", `bEaReR  ${SECRET} `);
    expect((await POST(request)).status).toBe(200);
  });
});

describe("POST /api/pad/moderate, what it removes", () => {
  it("takes a drawing off the wall", async () => {
    const { POST, redis } = await loadRoute();
    const res = await POST(post({ kind: "drawing", id: "d1" }, SECRET));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, removed: 1 });
    expect(redis.sets.get("pad:drawings")).toHaveLength(0);
  });

  it("takes a comment off the page", async () => {
    const { POST, redis } = await loadRoute();
    expect((await POST(post({ kind: "comment", id: "c1" }, SECRET))).status).toBe(200);
    expect(redis.sets.get("pad:comments")).toHaveLength(0);
  });

  it("leaves the other list alone", async () => {
    const { POST, redis } = await loadRoute();
    await POST(post({ kind: "drawing", id: "d1" }, SECRET));
    expect(redis.sets.get("pad:comments")).toHaveLength(1);
  });

  it("answers 404 for an id that is not there", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "drawing", id: "nope" }, SECRET));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, removed: 0 });
  });

  it("refuses a body that names neither list", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ kind: "everything", id: "d1" }, SECRET))).status).toBe(400);
    expect((await POST(post({ kind: "drawing" }, SECRET))).status).toBe(400);
    expect((await POST(post({ kind: "drawing", id: "" }, SECRET))).status).toBe(400);
    expect((await POST(post("not json", SECRET))).status).toBe(400);
  });

  it("never caches an answer", async () => {
    const { POST } = await loadRoute();
    const res = await POST(post({ kind: "drawing", id: "d1" }, SECRET));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
