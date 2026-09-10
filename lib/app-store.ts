import { appSnapshots, type AppSnapshot } from "@/data/app-store";

/**
 * What the home knows about an app, and where it learned it.
 *
 * Two products on this site are iOS apps, and the owner asked for them to be
 * shown "like the way they are on the App Store". They cannot be framed —
 * `apps.apple.com` sends `x-frame-options: DENY` and `frame-ancestors 'none'`,
 * so there is no embed to build and no widget to borrow. What Apple does serve
 * to anyone is the iTunes Lookup API, unauthenticated, which returns the
 * listing's icon, name, seller, genre, rating and screens as JSON. The card is
 * drawn here out of that, in the site's own type and the site's own ink.
 *
 * Everything in this module is either a pure function of one lookup row or the
 * one call that fetches them, and the two are kept apart on purpose: the
 * merge is where the honesty lives, and a merge that can only be exercised
 * through the network is a merge nobody tests.
 */

/** The public lookup endpoint. No key, no auth, comma-separated ids. */
export const LOOKUP_URL = "https://itunes.apple.com/lookup";

/**
 * How long a reading stands before the site asks again: six hours.
 *
 * Chosen against what actually moves. A rating averaged over thirty votes
 * shifts in the second decimal place when a vote lands, a version ships every
 * week or two, and an icon changes about never — so the fastest-moving figure
 * on this card moves slower than a day. Six hours is four reads a day, which
 * is more than enough to keep the figure honest and few enough that the home
 * page is a static prerender between them rather than a request-time fetch.
 *
 * It is deliberately not `no-store`. The now-playing instrument is `no-store`
 * because it reports what is happening *right now* and a cached answer would
 * be a false reading. A store rating is not a live reading, it is a fact about
 * a product, and re-asking Apple on every visit would spend a request per
 * visitor to change nothing.
 */
export const REVALIDATE_SECONDS = 21_600;

/**
 * How wide a screen is asked for.
 *
 * The lookup's `screenshotUrls` come back at `320x480bb`, which is a thumbnail:
 * 222 pixels across for a phone screen, blurred to mush the moment it is shown
 * at reading size. The path segment is a resize instruction rather than a file
 * name, so asking for `626x0w` — 626 wide, height from the source — returns the
 * same screen sharp. 626 is roughly twice the 313 CSS pixels a held phone frame
 * occupies at its widest on this site, which is what a 2x display needs and the
 * point past which more bytes buy nothing.
 */
export const SHOT_WIDTH = 626;

/** The one row of the lookup payload this site reads. Every field is optional
    because the payload is somebody else's and a missing field is a normal
    answer, not an error. */
export type LookupRow = {
  trackId?: number;
  trackName?: string;
  sellerName?: string;
  primaryGenreName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  trackViewUrl?: string;
  artworkUrl512?: string;
  screenshotUrls?: string[];
};

export type AppCard = Omit<AppSnapshot, "trackId" | "recorded"> & {
  /**
   * Where this card's figures came from.
   *
   * Not printed anywhere. It rides on the card's root element as a data
   * attribute so the degraded path can be *verified* rather than reasoned
   * about: point the lookup at a host that will not answer, load the page, and
   * read the attribute. A claim about a fallback that has only ever been
   * argued for is a claim nobody has checked.
   */
  source: "live" | "recorded";
};

/** Where the artwork proxy lives. See its route for why the target rides in
    the path rather than in a query parameter. */
export const ART_ROUTE = "/api/app-store/art";

/**
 * A same-origin URL for a piece of Apple's artwork.
 *
 * Never linked straight into `next/image`. The site allowlists no external
 * host to the optimiser — `next.config.ts` sets no `remotePatterns` at all —
 * and widening it to Apple's CDN would hand every future component permission
 * to load anything from `mzstatic.com`. The proxy is the narrower door, and it
 * is the same door `/api/now-playing/art` already opens for Spotify's covers.
 *
 * The scheme is dropped and the rest of the URL becomes path segments, host
 * first. That is not decoration: Next 16 will not optimise a local image whose
 * src carries a query string unless the config names an exact `search` to
 * match, and the search here *is* the artwork, so there is no exact value to
 * name. Each segment is escaped on the way in and Next unescapes it on the way
 * out, so the route gets back the URL that was put in.
 */
export function proxied(url: string): string {
  const rest = url.replace(/^https:\/\//, "");
  return `${ART_ROUTE}/${rest.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Rewrite a screenshot URL to the width the site actually shows it at.
 *
 * The last path segment of an mzstatic thumb URL is the resize instruction,
 * not a file name, so this replaces it. A URL that does not look like one is
 * handed back untouched rather than mangled — the proxy would refuse an
 * off-host URL anyway, and a rewrite that guesses is worse than one that
 * declines.
 */
export function atShotWidth(url: string): string {
  return url.replace(/\/[^/]+\.(jpg|jpeg|png|webp)$/i, `/${SHOT_WIDTH}x0w.jpg`);
}

/**
 * The card as the repo remembers it, with every asset served from `public/`.
 *
 * Written out field by field rather than spread with the two extras deleted.
 * A card is what the page renders and a snapshot is what the repo files, and
 * the two are different shapes on purpose — `trackId` is a query parameter and
 * `recorded` is provenance for whoever edits the file, and neither has any
 * business reaching a component. Listing the fields is what makes that visible
 * here instead of hiding in a rest element.
 */
export function recordedCard(snapshot: AppSnapshot): AppCard {
  return {
    slug: snapshot.slug,
    storeUrl: snapshot.storeUrl,
    name: snapshot.name,
    seller: snapshot.seller,
    genre: snapshot.genre,
    rating: snapshot.rating,
    ratingCount: snapshot.ratingCount,
    icon: snapshot.icon,
    shots: snapshot.shots,
    shotRatio: snapshot.shotRatio,
    source: "recorded",
  };
}

/**
 * Merge one live lookup row over the repo's snapshot, field by field.
 *
 * Field by field rather than all-or-nothing, because those are two different
 * failures. A lookup that does not answer leaves every figure a reading behind,
 * which is the floor and is fine. A lookup that answers with a row missing one
 * key is not a stale card — it is a fresh card with a hole in it, and printing
 * an empty seller because Apple happened to omit `sellerName` would be the site
 * forgetting something it already knew.
 *
 * The rating and its count travel together and are taken only when the count is
 * a real number, because an average without the number of votes behind it is
 * not a rating, it is a decimal.
 *
 * The screens are taken only when the payload actually carries some. An empty
 * `screenshotUrls` is how a listing between builds looks, and swapping four
 * committed screens for zero would empty a third of the card — which is the
 * one thing the floor exists to prevent.
 */
export function liveCard(snapshot: AppSnapshot, row: LookupRow): AppCard {
  const floor = recordedCard(snapshot);
  const shots = row.screenshotUrls?.length
    ? row.screenshotUrls.map((url) => proxied(atShotWidth(url)))
    : floor.shots;

  return {
    ...floor,
    source: "live",
    storeUrl: row.trackViewUrl ?? floor.storeUrl,
    name: row.trackName ?? floor.name,
    seller: row.sellerName ?? floor.seller,
    genre: row.primaryGenreName ?? floor.genre,
    rating:
      typeof row.userRatingCount === "number" && typeof row.averageUserRating === "number"
        ? row.averageUserRating
        : floor.rating,
    ratingCount:
      typeof row.userRatingCount === "number" ? row.userRatingCount : floor.ratingCount,
    icon: row.artworkUrl512 ? proxied(row.artworkUrl512) : floor.icon,
    shots,
  };
}

/**
 * Every app card, keyed by the `data/work.ts` slug that owns it.
 *
 * Rows are matched to snapshots by `trackId` rather than by position: the
 * lookup returns what it found, so two ids in and one row back is a normal
 * answer, and a positional match would quietly print one app's rating under
 * the other's name.
 */
export function cardsFrom(rows: LookupRow[]): Record<string, AppCard> {
  const byId = new Map(rows.map((row) => [String(row.trackId), row]));
  return Object.fromEntries(
    appSnapshots.map((snapshot) => {
      const row = byId.get(snapshot.trackId);
      return [snapshot.slug, row ? liveCard(snapshot, row) : recordedCard(snapshot)];
    }),
  );
}

/** Every card at the floor. The answer when the lookup cannot be reached at
    all, and the answer a build with no network gets. */
export function recordedCards(): Record<string, AppCard> {
  return Object.fromEntries(appSnapshots.map((s) => [s.slug, recordedCard(s)]));
}

/**
 * Ask Apple about both apps, and never throw.
 *
 * One request for both ids: the lookup takes them comma-separated, and two
 * round trips to fetch two rows of the same table would double the thing most
 * likely to fail for no benefit.
 *
 * Every way this can go wrong ends at the floor — a refused connection, a 429,
 * a 5xx, a body that will not parse, a payload with `resultCount: 0`. That is
 * the whole contract: this function returns cards or it returns cards.
 */
export async function readAppStore(): Promise<Record<string, AppCard>> {
  const ids = appSnapshots.map((app) => app.trackId).join(",");
  try {
    const response = await fetch(`${LOOKUP_URL}?id=${ids}`, {
      /* The one thing this must not be is uncached. Left to itself a fetch in
         Next 16 is not cached at all, which would make the home page dynamic
         and put an Apple request on the critical path of every visit. See
         REVALIDATE_SECONDS for the interval and why it is that. */
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return recordedCards();

    const body = (await response.json()) as { results?: LookupRow[] };
    return cardsFrom(body.results ?? []);
  } catch {
    return recordedCards();
  }
}
