import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/data/site";
import {
  STEP_CEILING,
  averageOf,
  isPlausible,
  lastNDates,
  stepsKey,
  tokenMatches,
  zonedDate,
} from "./steps";

describe("stepsKey", () => {
  it("namespaces by date", () => {
    expect(stepsKey("2026-08-18")).toBe("steps:2026-08-18");
  });
});

describe("isPlausible", () => {
  it("rejects negatives and non-finite values", () => {
    expect(isPlausible(null, -1)).toBe(false);
    expect(isPlausible(null, Number.NaN)).toBe(false);
    expect(isPlausible(null, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects values above the daily ceiling", () => {
    expect(isPlausible(null, STEP_CEILING + 1)).toBe(false);
    expect(isPlausible(null, STEP_CEILING)).toBe(true);
  });

  // Asserted against the literal, not the constant: the case above passes
  // against any ceiling at all, including a wrong one.
  it("puts the ceiling at 200000 exactly", () => {
    expect(STEP_CEILING).toBe(200000);
    expect(isPlausible(null, 200000)).toBe(true);
    expect(isPlausible(null, 200001)).toBe(false);
  });

  it("rejects a same-day regression, since steps only accumulate", () => {
    expect(isPlausible(5000, 4999)).toBe(false);
    expect(isPlausible(5000, 5000)).toBe(true);
    expect(isPlausible(5000, 5001)).toBe(true);
  });

  // A different prev, so the rule cannot be satisfied by hardcoding 5000.
  it("compares against whatever the prior reading was", () => {
    expect(isPlausible(12345, 12344)).toBe(false);
    expect(isPlausible(12345, 12346)).toBe(true);
    expect(isPlausible(1, 0)).toBe(false);
  });

  // A prior reading of zero is a real reading, not a missing one.
  it("treats a prior of 0 as a floor rather than as absent", () => {
    expect(isPlausible(0, 0)).toBe(true);
    expect(isPlausible(0, 1)).toBe(true);
  });

  it("accepts any plausible value when there is no prior reading", () => {
    expect(isPlausible(null, 0)).toBe(true);
    expect(isPlausible(null, 5000)).toBe(true);
  });
});

describe("averageOf", () => {
  it("returns 0 for no days rather than dividing by zero", () => {
    expect(averageOf([])).toBe(0);
  });

  it("averages over every day given, including zeroes", () => {
    expect(averageOf([
      { date: "2026-08-17", steps: 1000 },
      { date: "2026-08-18", steps: 0 },
    ])).toBe(500);
  });

  it("rounds to a whole step", () => {
    expect(averageOf([
      { date: "2026-08-16", steps: 1 },
      { date: "2026-08-17", steps: 1 },
      { date: "2026-08-18", steps: 2 },
    ])).toBe(1);
  });

  // Rounds rather than truncates — the case above passes against floor too.
  it("rounds up past the halfway mark", () => {
    expect(averageOf([
      { date: "2026-08-17", steps: 1 },
      { date: "2026-08-18", steps: 2 },
    ])).toBe(2);
    expect(averageOf([
      { date: "2026-08-15", steps: 1 },
      { date: "2026-08-16", steps: 2 },
      { date: "2026-08-17", steps: 2 },
      { date: "2026-08-18", steps: 2 },
    ])).toBe(2);
  });

  it("skips unreported days rather than counting them as zero", () => {
    expect(averageOf([
      { date: "2026-08-16", steps: null },
      { date: "2026-08-17", steps: null },
      { date: "2026-08-18", steps: 6200 },
    ])).toBe(6200);
  });

  it("returns 0 when nothing has been reported at all", () => {
    expect(averageOf([
      { date: "2026-08-17", steps: null },
      { date: "2026-08-18", steps: null },
    ])).toBe(0);
  });

  it("still counts a reported zero, which is a day of not walking", () => {
    expect(averageOf([
      { date: "2026-08-16", steps: null },
      { date: "2026-08-17", steps: 0 },
      { date: "2026-08-18", steps: 1000 },
    ])).toBe(500);
  });
});

describe("zonedDate", () => {
  it("reads the Lagos day, not the UTC one", () => {
    // 23:30 UTC is already 00:30 the next morning in Lagos.
    expect(zonedDate(new Date("2026-08-18T23:30:00Z"))).toBe("2026-08-19");
    expect(zonedDate(new Date("2026-08-18T12:00:00Z"))).toBe("2026-08-18");
  });

  it("rolls the year over an hour before UTC does", () => {
    expect(zonedDate(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("handles a leap day", () => {
    expect(zonedDate(new Date("2028-02-28T23:30:00Z"))).toBe("2028-02-29");
  });
});

describe("lastNDates", () => {
  it("returns n dates ending today, oldest first", () => {
    expect(lastNDates(new Date("2026-08-18T12:00:00Z"), 3))
      .toEqual(["2026-08-16", "2026-08-17", "2026-08-18"]);
  });

  it("crosses a month boundary", () => {
    expect(lastNDates(new Date("2026-09-01T12:00:00Z"), 2))
      .toEqual(["2026-08-31", "2026-09-01"]);
  });

  // The one case that separates a correct implementation from
  // `new Date().toISOString().slice(0,10)`: after 23:00 UTC the Lagos day has
  // already turned over, and a naive version is a full day behind.
  it("has already turned over at half past midnight in Lagos", () => {
    expect(lastNDates(new Date("2026-08-18T23:30:00Z"), 3))
      .toEqual(["2026-08-17", "2026-08-18", "2026-08-19"]);
  });

  it("crosses a year boundary in Lagos, not in UTC", () => {
    expect(lastNDates(new Date("2026-12-31T23:30:00Z"), 2))
      .toEqual(["2026-12-31", "2027-01-01"]);
  });
});

/**
 * The guarantee the whole ingest rests on. Evidenced here rather than by a
 * curl in a session nobody can re-run.
 */
describe("tokenMatches", () => {
  it("matches nothing when the secret is unset", () => {
    expect(tokenMatches("anything-at-all", undefined)).toBe(false);
    expect(tokenMatches("", undefined)).toBe(false);
  });

  it("matches nothing when the secret is set but blank", () => {
    expect(tokenMatches("", "")).toBe(false);
    expect(tokenMatches("   ", "   ")).toBe(false);
  });

  // A macro that interpolates a missing variable sends the string "undefined".
  it("refuses the literal string undefined against an unset secret", () => {
    expect(tokenMatches("undefined", undefined)).toBe(false);
  });

  it("refuses a wrong token", () => {
    expect(tokenMatches("wrong-secret", "right-secret")).toBe(false);
    expect(tokenMatches("x", "right-secret")).toBe(false);
    expect(tokenMatches("right-secret-plus", "right-secret")).toBe(false);
  });

  it("accepts the right token", () => {
    expect(tokenMatches("right-secret", "right-secret")).toBe(true);
  });

  it("tolerates stray whitespace on either side", () => {
    expect(tokenMatches("right-secret", "right-secret\n")).toBe(true);
    expect(tokenMatches(" right-secret ", "right-secret")).toBe(true);
  });
});

describe("site.stepGoal", () => {
  it("is 10000", () => {
    expect(site.stepGoal).toBe(10000);
  });
});

/**
 * The store, faked at the fetch boundary. command() is a single fetch to the
 * Upstash REST endpoint, so a stubbed global is enough to exercise every read
 * and write path — including the monotonic guard, which is the one behaviour
 * that cannot safely be re-verified against the production Redis.
 */
function fakeRedis(seed: Record<string, string | number> = {}) {
  const store = new Map<string, string>(
    Object.entries(seed).map(([k, v]) => [k, String(v)]),
  );
  const calls: string[][] = [];

  const fetchImpl = async (_url: unknown, init: { body: string }) => {
    const args = (JSON.parse(init.body) as (string | number)[]).map(String);
    calls.push(args);
    const [cmd, ...rest] = args;
    let result: unknown = null;
    switch (cmd.toUpperCase()) {
      case "GET":
        result = store.get(rest[0]) ?? null;
        break;
      case "SET":
        store.set(rest[0], rest[1]);
        result = "OK";
        break;
      case "MGET":
        result = rest.map((key) => store.get(key) ?? null);
        break;
    }
    return { ok: true, json: async () => ({ result }) };
  };

  return { store, calls, fetchImpl };
}

async function loadSteps(seed?: Record<string, string | number>) {
  vi.resetModules();
  vi.stubEnv("KV_REST_API_URL", "https://store.test");
  vi.stubEnv("KV_REST_API_TOKEN", "store-token");
  const redis = fakeRedis(seed);
  vi.stubGlobal("fetch", redis.fetchImpl);
  return { redis, steps: await import("./steps") };
}

async function loadStepsWithoutStore() {
  vi.resetModules();
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_TOKEN", "");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  const fetchImpl = vi.fn();
  vi.stubGlobal("fetch", fetchImpl);
  return { fetchImpl, steps: await import("./steps") };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("readDay", () => {
  it("reads a stored total", async () => {
    const { steps } = await loadSteps({ "steps:2026-08-18": 6200 });
    expect(await steps.readDay("2026-08-18")).toBe(6200);
  });

  it("answers null for a day nobody reported", async () => {
    const { steps } = await loadSteps();
    expect(await steps.readDay("2026-08-18")).toBe(null);
  });

  it("answers null with no store, without reaching for one", async () => {
    const { steps, fetchImpl } = await loadStepsWithoutStore();
    expect(await steps.readDay("2026-08-18")).toBe(null);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("writeSteps", () => {
  it("sets the day key and its expiry in one atomic command", async () => {
    const { steps, redis } = await loadSteps();
    const today = steps.zonedDate();

    expect(await steps.writeSteps(today, 6200)).toBe(true);
    expect(redis.store.get(`steps:${today}`)).toBe("6200");
    expect(redis.calls[0]).toEqual(["SET", `steps:${today}`, "6200", "EX", "5184000"]);
  });

  it("moves the freshness mark when the post is about today", async () => {
    const { steps, redis } = await loadSteps();
    await steps.writeSteps(steps.zonedDate(), 6200);
    expect(redis.store.has("steps:updated-at")).toBe(true);
  });

  it("leaves the freshness mark alone when backfilling an older day", async () => {
    const { steps, redis } = await loadSteps();
    expect(await steps.writeSteps("2026-08-16", 8000)).toBe(true);
    expect(redis.store.get("steps:2026-08-16")).toBe("8000");
    // A backfill is new history, not new news.
    expect(redis.store.has("steps:updated-at")).toBe(false);
  });

  it("reports failure rather than throwing when there is no store", async () => {
    const { steps } = await loadStepsWithoutStore();
    expect(await steps.writeSteps("2026-08-18", 6200)).toBe(false);
  });

  it("reports failure when the store answers badly", async () => {
    vi.resetModules();
    vi.stubEnv("KV_REST_API_URL", "https://store.test");
    vi.stubEnv("KV_REST_API_TOKEN", "store-token");
    vi.stubGlobal("fetch", async () => ({ ok: false, json: async () => ({}) }));
    const steps = await import("./steps");
    expect(await steps.writeSteps("2026-08-18", 6200)).toBe(false);
  });

  it("degrades to failure rather than throwing when the fetch itself throws", async () => {
    vi.resetModules();
    vi.stubEnv("KV_REST_API_URL", "https://store.test");
    vi.stubEnv("KV_REST_API_TOKEN", "store-token");
    vi.stubGlobal("fetch", async () => {
      throw new Error("network down");
    });
    const steps = await import("./steps");
    expect(await steps.writeSteps("2026-08-18", 6200)).toBe(false);
    expect(await steps.readDay("2026-08-18")).toBe(null);
  });
});

describe("readSteps", () => {
  it("answers null with no store, so the route can say so", async () => {
    const { steps } = await loadStepsWithoutStore();
    expect(await steps.readSteps(10000)).toBe(null);
  });

  it("reads seven days in one MGET plus one GET", async () => {
    const { steps, redis } = await loadSteps();
    await steps.readSteps(10000);

    const commands = redis.calls.map((call) => call[0]);
    expect(commands.sort()).toEqual(["GET", "MGET"]);
    expect(redis.calls.find((call) => call[0] === "MGET")).toHaveLength(8);
  });

  it("returns today's total and the goal it was given", async () => {
    const today = new Date();
    const { steps } = await loadSteps();
    const key = `steps:${steps.zonedDate(today)}`;
    const { steps: fresh } = await loadSteps({ [key]: 6200 });

    const reading = await fresh.readSteps(10000);
    expect(reading?.today).toBe(6200);
    expect(reading?.goal).toBe(10000);
    expect(reading?.days).toHaveLength(7);
  });

  // The finding that started this: a silent phone must not deflate the week.
  it("averages over reported days only", async () => {
    const { steps } = await loadSteps();
    const today = steps.zonedDate();
    const { steps: fresh } = await loadSteps({ [`steps:${today}`]: 6200 });

    const reading = await fresh.readSteps(10000);
    expect(reading?.average7).toBe(6200);
    expect(reading?.days.filter((d) => d.steps === null)).toHaveLength(6);
  });

  it("leaves today null until the first post of the morning", async () => {
    const { steps } = await loadSteps();
    const reading = await steps.readSteps(10000);
    // Not 0 — a day nobody has reported is not a day of no walking.
    expect(reading?.today).toBe(null);
    expect(reading?.average7).toBe(0);
    expect(reading?.updatedAt).toBe(null);
  });

  it("keeps a reported zero as zero", async () => {
    const { steps } = await loadSteps();
    const today = steps.zonedDate();
    const { steps: fresh } = await loadSteps({ [`steps:${today}`]: 0 });

    const reading = await fresh.readSteps(10000);
    expect(reading?.today).toBe(0);
  });

  it("reads back what writeSteps wrote", async () => {
    const { steps } = await loadSteps();
    const today = steps.zonedDate();

    await steps.writeSteps(today, 6200);
    const reading = await steps.readSteps(10000);

    expect(reading?.today).toBe(6200);
    expect(reading?.updatedAt).toBeTypeOf("number");
    expect(reading?.days.at(-1)).toEqual({ date: today, steps: 6200 });
  });
});

/**
 * The route contract, driven through the real handlers. This is the shape the
 * phone sees and the shape Task 4 consumes.
 */
async function loadRoute(options: {
  secret?: string;
  store?: boolean;
  seed?: Record<string, string | number>;
}) {
  vi.resetModules();
  if (options.secret === undefined) {
    vi.stubEnv("STEPS_INGEST_SECRET", "");
  } else {
    vi.stubEnv("STEPS_INGEST_SECRET", options.secret);
  }
  vi.stubEnv("KV_REST_API_URL", options.store === false ? "" : "https://store.test");
  vi.stubEnv("KV_REST_API_TOKEN", options.store === false ? "" : "store-token");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

  const redis = fakeRedis(options.seed);
  vi.stubGlobal("fetch", redis.fetchImpl);

  return { redis, route: await import("@/app/api/steps/route") };
}

function post(body: string, bearer?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (bearer !== undefined) headers.authorization = bearer;
  return new Request("https://example.test/api/steps", { method: "POST", headers, body });
}

const SECRET = "test-only-secret";

describe("POST /api/steps", () => {
  it("returns 401 when STEPS_INGEST_SECRET is unset, bearer or not", async () => {
    const { route } = await loadRoute({});
    expect((await route.POST(post('{"steps":5000}'))).status).toBe(401);
    expect(
      (await route.POST(post('{"steps":5000}', "Bearer anything-at-all"))).status,
    ).toBe(401);
  });

  it("returns 401 with no bearer and with a wrong one", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    expect((await route.POST(post('{"steps":5000}'))).status).toBe(401);
    expect((await route.POST(post('{"steps":5000}', "Bearer wrong"))).status).toBe(401);
    expect((await route.POST(post('{"steps":5000}', "Bearer x"))).status).toBe(401);
    expect((await route.POST(post('{"steps":5000}', SECRET))).status).toBe(401);
  });

  it("accepts a lowercase scheme, since RFC 7235 says the scheme is case-insensitive", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    expect((await route.POST(post('{"steps":5000}', `bearer ${SECRET}`))).status).toBe(200);
  });

  it("does not touch the store for an unauthenticated request", async () => {
    const { route, redis } = await loadRoute({ secret: SECRET });
    await route.POST(post('{"steps":5000}', "Bearer wrong"));
    expect(redis.calls).toHaveLength(0);
  });

  it("accepts a correct bearer and stores the total", async () => {
    const { route, redis } = await loadRoute({ secret: SECRET });
    const res = await route.POST(post('{"steps":5000}', `Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(redis.store.get(stepsKey(zonedDate()))).toBe("5000");
  });

  it("rejects a negative total with 422", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    const res = await route.POST(post('{"steps":-1}', `Bearer ${SECRET}`));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "implausible" });
  });

  it("rejects a total above the ceiling with 422", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    expect((await route.POST(post('{"steps":200001}', `Bearer ${SECRET}`))).status).toBe(422);
    expect((await route.POST(post('{"steps":200000}', `Bearer ${SECRET}`))).status).toBe(200);
  });

  // The monotonic guard, which cannot safely be re-verified against production.
  it("refuses a repeat post of a lower total for the same day", async () => {
    const { route, redis } = await loadRoute({ secret: SECRET });

    expect((await route.POST(post('{"steps":5000}', `Bearer ${SECRET}`))).status).toBe(200);
    expect((await route.POST(post('{"steps":4999}', `Bearer ${SECRET}`))).status).toBe(422);
    expect((await route.POST(post('{"steps":5000}', `Bearer ${SECRET}`))).status).toBe(200);
    expect((await route.POST(post('{"steps":6200}', `Bearer ${SECRET}`))).status).toBe(200);

    // The store kept the peak, not the last thing it was told.
    expect(redis.store.get(stepsKey(zonedDate()))).toBe("6200");
  });

  it("rejects a malformed body with 400 and a badly shaped date with 422", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    expect((await route.POST(post("not json", `Bearer ${SECRET}`))).status).toBe(400);
    expect(
      (await route.POST(post('{"steps":10,"date":"18-08-2026"}', `Bearer ${SECRET}`))).status,
    ).toBe(422);
  });

  it("rejects a non-numeric total with 422", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    // An unset Tasker variable posts the literal string, which is not JSON at
    // all; a quoted one is, and has to be refused here.
    expect((await route.POST(post('{"steps":"6200"}', `Bearer ${SECRET}`))).status).toBe(422);
    expect((await route.POST(post("{}", `Bearer ${SECRET}`))).status).toBe(422);
  });

  it("backfills an explicit past date without disturbing today", async () => {
    const { route, redis } = await loadRoute({ secret: SECRET });
    const res = await route.POST(
      post('{"steps":8000,"date":"2026-08-16"}', `Bearer ${SECRET}`),
    );

    expect(res.status).toBe(200);
    expect(redis.store.get("steps:2026-08-16")).toBe("8000");
    expect(redis.store.has("steps:updated-at")).toBe(false);
  });

  it("answers 501 rather than 503 when no store will ever be reached", async () => {
    const { route } = await loadRoute({ secret: SECRET, store: false });
    const res = await route.POST(post('{"steps":5000}', `Bearer ${SECRET}`));
    expect(res.status).toBe(501);
    expect(await res.json()).toEqual({ error: "store not configured" });
  });
});

describe("GET /api/steps", () => {
  it("says so plainly when there is no store", async () => {
    const { route } = await loadRoute({ store: false });
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ configured: false });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns a reading whose shape Task 4 can rely on", async () => {
    const { route } = await loadRoute({ secret: SECRET });
    await route.POST(post('{"steps":6200}', `Bearer ${SECRET}`));

    const reading = (await (await route.GET()).json()) as {
      today: number | null;
      days: { date: string; steps: number | null }[];
      average7: number;
      updatedAt: number | null;
      goal: number;
    };

    expect(reading.today).toBe(6200);
    expect(reading.days).toHaveLength(7);
    expect(reading.goal).toBe(10000);
    expect(reading.average7).toBe(6200);
    expect(reading.updatedAt).toBeTypeOf("number");
    expect(reading.days.at(-1)?.steps).toBe(6200);
    expect(reading.days[0].steps).toBe(null);
  });
});
