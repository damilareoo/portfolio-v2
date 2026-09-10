import { afterEach, describe, expect, it, vi } from "vitest";
import { appSnapshots } from "@/data/app-store";
import {
  atShotWidth,
  cardsFrom,
  liveCard,
  proxied,
  readAppStore,
  recordedCard,
  recordedCards,
  SHOT_WIDTH,
  type LookupRow,
} from "./app-store";

/**
 * One rule, from both ends: the card always says something.
 *
 * Every assertion here is a version of that. The floor exists because a rating
 * is fetched from somebody else's API over somebody else's network, and the
 * failure this guards against is not an exception — it is a card that renders
 * with an empty seller, no icon and a third of itself blank because a payload
 * came back thinner than expected.
 */

const [endgame] = appSnapshots;

const full: LookupRow = {
  trackId: Number(endgame.trackId),
  trackName: "Endgame AI",
  sellerName: "Endgame Chess Inc",
  primaryGenreName: "Games",
  averageUserRating: 4.9,
  userRatingCount: 41,
  trackViewUrl: "https://apps.apple.com/us/app/endgame-ai/id6755304651?uo=4",
  artworkUrl512: "https://is1-ssl.mzstatic.com/image/thumb/x/y/512x512bb.jpg",
  screenshotUrls: [
    "https://is1-ssl.mzstatic.com/image/thumb/x/one.png/320x480bb.jpg",
    "https://is1-ssl.mzstatic.com/image/thumb/x/two.png/320x480bb.jpg",
  ],
};

const ok = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

afterEach(() => vi.unstubAllGlobals());

describe("the artwork URLs", () => {
  it("sends every piece of Apple's artwork through the site's own origin", () => {
    // The optimiser allowlists no external host, and the fix for that is this
    // proxy rather than opening `remotePatterns` onto Apple's CDN.
    const url = proxied("https://is1-ssl.mzstatic.com/image/thumb/x/512x512bb.jpg");
    expect(url).toBe("/api/app-store/art/is1-ssl.mzstatic.com/image/thumb/x/512x512bb.jpg");
  });

  it("carries the target in the path, never in a query string", () => {
    /* Next 16 refuses to optimise a local image whose src has a search string
       unless the config names an exact one to match, and the search here would
       be the artwork itself. A proxied URL with a `?` in it is a card whose
       pictures 400. */
    for (const app of appSnapshots) {
      expect(proxied(`https://is1-ssl.mzstatic.com/${app.slug}.jpg`)).not.toContain("?");
    }
  });

  it("asks for a screen at reading width, not at thumbnail width", () => {
    // The last path segment is a resize instruction, not a file name. The
    // payload's own `320x480bb` is 222 pixels of phone screen.
    expect(atShotWidth("https://x.mzstatic.com/image/thumb/a/b.png/320x480bb.jpg")).toBe(
      `https://x.mzstatic.com/image/thumb/a/b.png/${SHOT_WIDTH}x0w.jpg`,
    );
  });

  it("hands back a URL it does not recognise rather than mangling it", () => {
    const odd = "https://x.mzstatic.com/image/thumb/a/b";
    expect(atShotWidth(odd)).toBe(odd);
  });
});

describe("merging a live row over the snapshot", () => {
  it("takes every field the row carries", () => {
    const card = liveCard(endgame, full);
    expect(card.source).toBe("live");
    expect(card.rating).toBe(4.9);
    expect(card.ratingCount).toBe(41);
    expect(card.shots).toHaveLength(2);
    expect(card.shots[0]).toContain("626x0w.jpg");
    expect(card.icon.startsWith("/api/app-store/art")).toBe(true);
  });

  it("keeps what it already knew for every field the row omits", () => {
    /* A row missing a key is not a stale card, it is a fresh card with a hole
       in it — and an empty seller printed because Apple happened to omit
       `sellerName` is the site forgetting something it had written down. */
    const card = liveCard(endgame, { trackId: Number(endgame.trackId) });
    expect(card.name).toBe(endgame.name);
    expect(card.seller).toBe(endgame.seller);
    expect(card.genre).toBe(endgame.genre);
    expect(card.storeUrl).toBe(endgame.storeUrl);
    expect(card.icon).toBe(endgame.icon);
    expect(card.shots).toEqual(endgame.shots);
  });

  it("refuses an average with no count behind it", () => {
    // An average without the number of votes under it is a decimal, not a
    // rating, so the pair travels together or neither of them moves.
    const card = liveCard(endgame, { averageUserRating: 5 });
    expect(card.rating).toBe(endgame.rating);
    expect(card.ratingCount).toBe(endgame.ratingCount);
  });

  it("keeps the committed screens when the row carries none", () => {
    // Swapping four screens for zero would empty a third of the card, which is
    // the one thing the floor exists to prevent.
    const card = liveCard(endgame, { ...full, screenshotUrls: [] });
    expect(card.shots).toEqual(endgame.shots);
  });
});

describe("matching rows to apps", () => {
  it("joins on the track id, never on position", () => {
    /* Two ids in and one row back is a normal answer from this API. Matching
       by position would print one app's rating under the other's name. */
    const cards = cardsFrom([{ ...full, trackId: Number(appSnapshots[1].trackId) }]);
    expect(cards[appSnapshots[1].slug].source).toBe("live");
    expect(cards[appSnapshots[0].slug].source).toBe("recorded");
  });

  it("gives every app a card, whatever came back", () => {
    for (const cards of [cardsFrom([]), recordedCards()]) {
      expect(Object.keys(cards).sort()).toEqual(appSnapshots.map((a) => a.slug).sort());
      for (const card of Object.values(cards)) {
        expect(card.name).not.toHaveLength(0);
        expect(card.seller).not.toHaveLength(0);
        expect(card.icon).not.toHaveLength(0);
        expect(card.shots.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("reading the store", () => {
  it("asks for both apps in one request", async () => {
    const fetcher = vi.fn(() => Promise.resolve(ok({ results: [full] })));
    vi.stubGlobal("fetch", fetcher);
    await readAppStore();
    const [url] = fetcher.mock.calls[0] as unknown as [string];
    expect(url).toContain(appSnapshots.map((a) => a.trackId).join(","));
  });

  it("caches the answer instead of asking on every visit", async () => {
    // A rating is a fact about a product, not a live reading. `no-store` here
    // would put an Apple request on the critical path of every page view.
    const fetcher = vi.fn(() => Promise.resolve(ok({ results: [full] })));
    vi.stubGlobal("fetch", fetcher);
    await readAppStore();
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit & {
      next?: { revalidate?: number };
    }];
    expect(init.next?.revalidate).toBeGreaterThan(0);
    expect(init.cache).toBeUndefined();
  });

  it("falls to the floor for every way the lookup can fail", async () => {
    const failures = [
      () => Promise.reject(new Error("no network")),
      () => Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) }),
      () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error("html")) }),
      () => Promise.resolve(ok({ resultCount: 0, results: [] })),
      () => Promise.resolve(ok({})),
    ];
    for (const failure of failures) {
      vi.stubGlobal("fetch", vi.fn(failure));
      const cards = await readAppStore();
      expect(Object.values(cards).map((c) => c.source)).toEqual(
        appSnapshots.map(() => "recorded"),
      );
      expect(cards[endgame.slug]).toEqual(recordedCard(endgame));
    }
  });
});

describe("the committed floor", () => {
  it("keeps every app's files inside its own directory under public/apps", () => {
    /* The floor is only a floor if the assets are in the repo. A snapshot
       pointing at an mzstatic URL would degrade to a card whose pictures are
       fetched from the network that just failed. */
    for (const app of appSnapshots) {
      expect(app.icon.startsWith(`/apps/${app.slug}/`), app.slug).toBe(true);
      for (const shot of app.shots) {
        expect(shot.startsWith(`/apps/${app.slug}/`), shot).toBe(true);
      }
    }
  });

  it("names a slug that data/work.ts actually holds", async () => {
    const { work } = await import("@/data/work");
    for (const app of appSnapshots) {
      expect(work.some((item) => item.slug === app.slug), app.slug).toBe(true);
    }
  });
});
