/**
 * Roles, as recorded on LinkedIn. Newest first.
 *
 * Newest first is how a CV is written and it is not how the site reads them:
 * /about draws these on a time axis, earliest first, and works out for itself
 * which of them ran at the same time. Order here is the record's own; order
 * there is derived. See `lib/experience.ts` — nothing outside that file parses
 * a `period`.
 *
 * `logo` is the company's own OG image where it publishes one, so the mark
 * carries the company's artwork rather than something invented here. `mark` is
 * the second half of that, and the two are not the same claim: a `logo` is a
 * picture the company published, a `mark` says the picture is a wordmark and
 * records where inside the plate it sits. Only a role with both can stand as an
 * image; a role with neither is set in the site's own mono.
 */

export type Role = {
  role: string;
  company: string;
  /** The company's site — the row links out to it, not to LinkedIn. */
  url: string;
  period: string;
  location: string;
  /** Contract, full-time, and so on, as LinkedIn records it. */
  engagement?: string;
  logo?: string;
  /** Set only where `logo` is a real wordmark. See `Mark`. */
  mark?: Mark;
};

/**
 * Where a company's wordmark actually sits inside its `logo`.
 *
 * An OG plate is mostly margin, and the margin is not the same on any two of
 * them. Endgame's wordmark is 75px tall on a 630px plate and HEX's is 137px,
 * so setting both plates to one box would print one company's name at nearly
 * twice the other's — three names at three sizes, which reads as three levels
 * of importance rather than three facts. These numbers are what let each plate
 * be scaled until the wordmarks share a cap height, and share it with the third
 * name, which is set in type because there is no file for it.
 *
 * Every figure is measured off the file rather than estimated, and every one is
 * a ratio to the plate's *height*, width included, so one scale factor drives
 * both axes. Cap height rather than bounding box: Endgame is lowercase with a
 * descender and a sparkle above the ai, HEX is all caps, and matching their
 * outermost pixels would set HEX visibly smaller than the name beside it. Cap
 * height is what the eye measures a wordmark by.
 *
 * Both wordmarks sit within three pixels of their plate's centre — measured —
 * which is what lets the crop simply centre the plate rather than carry an
 * offset per file.
 *
 * Presence is also the switch. A role with no `mark` has no wordmark the site
 * can use, whatever `logo` happens to point at, and its name is set in mono
 * instead of cropping product art into the shape of a logo.
 */
export type Mark = {
  /** The plate's pixel dimensions, as the file carries them. */
  plate: [width: number, height: number];
  /** The wordmark's cap height ÷ the plate's height. */
  cap: number;
  /** The wordmark's full width ÷ the plate's height. */
  width: number;
  /**
   * The wordmark's full height ÷ the plate's height — ascenders, descenders
   * and anything floating above them, not just the caps. The tile is sized off
   * the tallest of these, so a mark can never be cropped by the box that is
   * meant to hold it.
   */
  height: number;
};

export const roles: Role[] = [
  {
    role: "Product Designer",
    company: "Endgame AI",
    url: "https://endgame.ai",
    period: "Apr 2026 — Aug 2026",
    location: "New York City Metropolitan Area · Remote",
    engagement: "Contract",
    logo: "/companies/endgame.png",
    mark: { plate: [1200, 630], cap: 75 / 630, width: 596 / 630, height: 108 / 630 },
  },
  {
    role: "Product Designer",
    company: "ChessEver",
    url: "https://chessever.com",
    period: "Apr 2025 — Apr 2026",
    location: "United States · Remote",
    engagement: "Contract",
    /* No `logo` and no `mark`. It used to carry `/work/chessever/01-featured.jpg`
       — a product screenshot — because the About ladder had a box to fill and
       that was the only ChessEver picture the repo held. The ladder is a
       timeline now and draws the same marks the hero does, so the box is gone
       and the field with it: a screenshot filed under `logo` is a claim that
       the site has a mark for this company, and it does not. The screenshot is
       still in `data/work.ts`, where it is what it actually is. A real mark
       from ChessEver is what ends this. */
  },
  {
    role: "Design Partner",
    company: "HEX",
    url: "https://hex.inc",
    period: "Mar 2025 — Apr 2026",
    location: "San Francisco, California · Remote",
    engagement: "Contract",
    logo: "/companies/hex.png",
    mark: { plate: [1200, 630], cap: 137 / 630, width: 380 / 630, height: 137 / 630 },
  },
];
