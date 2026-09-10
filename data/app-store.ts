/**
 * Two App Store listings, as this repo last read them.
 *
 * This file is the floor, not the reading. `lib/app-store.ts` asks Apple for
 * the live record every six hours, and everything here is what the card prints
 * when that ask does not come back: a lookup that 429s, a listing that moves,
 * a build running on a machine with no network. A card that says nothing is
 * worse than a card that says something slightly old, so nothing on the card
 * is allowed to depend on the network having answered.
 *
 * Every number was copied from the live payload on the date in `recorded`, and
 * every file under `public/apps/<slug>/` was downloaded from the same payload
 * on the same day. That is what makes the floor a floor rather than a
 * placeholder: the degraded card is the real card, one reading behind.
 *
 * Two things are deliberately not here. There is no `description` — the App
 * Store's marketing copy is Apple's voice and `data/work.ts` is the site's, and
 * a card carrying both would be the site quoting a press release about work it
 * did itself. And there is no rating date on the card: the figure is presented
 * as the product's rating, not as an instrument reading, so it carries no
 * timestamp for the same reason the company marks carry no "as supplied on"
 * line. `recorded` is provenance for whoever next edits this file.
 *
 * A literal App Store embed was the first thing asked for and it cannot be
 * built: `apps.apple.com` answers with `x-frame-options: DENY` and a CSP
 * carrying `frame-ancestors 'none'`. There is no widget and no oEmbed. What
 * there is, is the public iTunes Lookup API — no key, no auth — and a card the
 * site draws itself out of what it returns, which is better than a frame on
 * every axis that matters here: it is set in the site's own type, it keeps the
 * ink tokens, it costs no third-party frame, and its rating stays current.
 */

export type AppSnapshot = {
  /** The `data/work.ts` slug this listing belongs to. The join is by slug. */
  slug: string;
  /** Apple's `trackId`. The whole of the lookup query. */
  trackId: string;
  /** The listing itself, for the card's one control. */
  storeUrl: string;
  /**
   * The name on the listing, which is not always the name of the work.
   * ChessEver files itself as "ChessEver: Follow Live Chess"; `data/work.ts`
   * calls the piece "ChessEver". Both are right and neither is a substitute
   * for the other — see `components/app-store-card.tsx` for which one prints.
   */
  name: string;
  /** The seller of record. Apple's `sellerName`, not `artistName`. */
  seller: string;
  /** Apple's `primaryGenreName`. */
  genre: string;
  /** `averageUserRating`, out of five, to Apple's full precision. */
  rating: number;
  /** `userRatingCount` — how many ratings that average is over. */
  ratingCount: number;
  /** The 512px icon, committed under public/apps/<slug>/. */
  icon: string;
  /** The first four screens of the listing, committed the same way. */
  shots: string[];
  /**
   * The shape of this listing's screens, as a CSS aspect-ratio.
   *
   * Measured off the files rather than declared, and per app rather than once:
   * the lookup payload carries no dimensions at all, and each listing's screens
   * come from one device apiece — Endgame's from a 17 Pro Max simulator at
   * 626x1360, ChessEver's at 626x1354. The two differ by a quarter of a
   * percent, which is invisible, and guessing "9 / 19.5" for both would have
   * been a number nobody measured that happens to be close.
   */
  shotRatio: string;
  /** When every figure and file above was taken from the live payload. */
  recorded: string;
};

export const appSnapshots: AppSnapshot[] = [
  {
    slug: "endgame-ai",
    trackId: "6755304651",
    storeUrl: "https://apps.apple.com/us/app/endgame-ai/id6755304651",
    name: "Endgame AI",
    seller: "Endgame Chess Inc",
    genre: "Games",
    rating: 4.73332,
    ratingCount: 30,
    icon: "/apps/endgame-ai/icon.jpg",
    shots: [
      "/apps/endgame-ai/01.jpg",
      "/apps/endgame-ai/02.jpg",
      "/apps/endgame-ai/03.jpg",
      "/apps/endgame-ai/04.jpg",
    ],
    shotRatio: "626 / 1360",
    recorded: "2026-09-10",
  },
  {
    slug: "chessever",
    trackId: "6752567269",
    storeUrl: "https://apps.apple.com/us/app/chessever-follow-live-chess/id6752567269",
    name: "ChessEver: Follow Live Chess",
    seller: "ChessEver LLC",
    genre: "Games",
    rating: 4.94595,
    ratingCount: 37,
    icon: "/apps/chessever/icon.jpg",
    shots: [
      "/apps/chessever/01.jpg",
      "/apps/chessever/02.jpg",
      "/apps/chessever/03.jpg",
      "/apps/chessever/04.jpg",
    ],
    shotRatio: "626 / 1354",
    recorded: "2026-09-10",
  },
];
