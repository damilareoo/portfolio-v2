// app/api/now-playing/route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

/**
 * One rule, tested from the server end: an instrument that cannot read says so.
 *
 * Every assertion below is really the same assertion. A failure must never
 * leave here wearing `isPlaying`, because `isPlaying: false` is what the card
 * prints "Silent" for — and "Silent" is a claim about the world, not an
 * apology for not knowing it.
 */

const CREDENTIALS = {
  SPOTIFY_CLIENT_ID: "id",
  SPOTIFY_CLIENT_SECRET: "secret",
  SPOTIFY_REFRESH_TOKEN: "refresh",
};

const json = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

/** A token exchange that works, so the test after it is about the second call. */
const withToken = (then: () => unknown) => {
  let call = 0;
  return vi.fn(() => {
    call += 1;
    return Promise.resolve(call === 1 ? json({ access_token: "token" }) : then());
  });
};

const body = async () => (await GET()).json() as Promise<Record<string, unknown>>;

beforeEach(() => {
  for (const [key, value] of Object.entries(CREDENTIALS)) vi.stubEnv(key, value);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/now-playing", () => {
  it("admits it cannot read when there are no credentials to read with", async () => {
    vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn());
    expect(await body()).toEqual({ configured: false });
  });

  it("admits it cannot read when Spotify stops honouring the refresh token", async () => {
    // The failure that prompted all of this: a token expires on a live
    // deployment and every visitor's footer starts claiming silence.
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json({ error: "invalid_grant" }, 400))));
    const answer = await body();
    expect(answer).toEqual({ configured: false });
    expect(answer).not.toHaveProperty("isPlaying");
  });

  it("admits it cannot read when Spotify throttles it", async () => {
    vi.stubGlobal("fetch", withToken(() => json({ error: "rate limited" }, 429)));
    expect(await body()).toEqual({ configured: false });
  });

  it("admits it cannot read when Spotify is down", async () => {
    vi.stubGlobal("fetch", withToken(() => json({}, 503)));
    expect(await body()).toEqual({ configured: false });
  });

  it("admits it cannot read when the network refuses", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))));
    expect(await body()).toEqual({ configured: false });
  });

  it("admits it cannot read when the body will not parse", async () => {
    vi.stubGlobal(
      "fetch",
      withToken(() => ({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("unexpected token")),
      })),
    );
    expect(await body()).toEqual({ configured: false });
  });

  it("reports silence as a reading, because 204 is Spotify answering", async () => {
    vi.stubGlobal("fetch", withToken(() => ({ ok: true, status: 204, json: () => Promise.resolve(null) })));
    expect(await body()).toEqual({ isPlaying: false });
  });

  it("reports a paused player as silence, not as ignorance", async () => {
    vi.stubGlobal("fetch", withToken(() => json({ is_playing: false, item: null })));
    expect(await body()).toEqual({ isPlaying: false });
  });

  it("keeps `is_playing` when Spotify will not name what is playing", async () => {
    // An advert or a local file: something is playing and cannot be reported.
    // Flattening this to `isPlaying: false` would print "Silent" over sound.
    vi.stubGlobal("fetch", withToken(() => json({ is_playing: true, item: null })));
    expect(await body()).toEqual({ isPlaying: true });
  });

  it("reports the track when there is one", async () => {
    vi.stubGlobal(
      "fetch",
      withToken(() =>
        json({
          is_playing: true,
          progress_ms: 1000,
          item: {
            name: "Bloom",
            duration_ms: 240_000,
            artists: [{ name: "Radiohead" }, { name: "Guest" }],
            album: {
              images: [
                { url: "https://i.scdn.co/small.jpg", width: 64 },
                { url: "https://i.scdn.co/medium.jpg", width: 300 },
                { url: "https://i.scdn.co/large.jpg", width: 640 },
              ],
            },
            external_urls: { spotify: "https://open.spotify.com/track/1" },
          },
        }),
      ),
    );
    const answer = await body();
    expect(answer.isPlaying).toBe(true);
    expect(answer.title).toBe("Bloom");
    expect(answer.artist).toBe("Radiohead, Guest");
    expect(answer.progressMs).toBe(1000);
    // The smallest rung that clears four source pixels per cell, not the largest.
    expect(answer.artUrl).toContain(encodeURIComponent("https://i.scdn.co/medium.jpg"));
  });

  it("never caches an answer about right now", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json({}, 500))));
    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
  });
});
