/**
 * Roles, as recorded on LinkedIn. Newest first.
 *
 * `logo` is the company's own OG image where it publishes one, so the box
 * carries the company's mark rather than something invented here. ChessEver
 * serves no metadata at all, so its own product art stands in.
 *
 * `mark` is the second half of that, and the two are not the same claim. A
 * `logo` is whatever picture the About ladder can put in a box; a `mark` says
 * the picture is a wordmark and records where inside the plate it sits. Only
 * the roles that have one can stand in the hero as an image.
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
    /* Product art, not a mark. ChessEver publishes no OG image and no logo
       file, so this is a screenshot standing in for one on the About ladder.
       It carries no `mark`, which is what keeps it out of the marks row as an
       image: a screenshot cropped square in a line of two real wordmarks reads
       as a mistake rather than as a third company. */
    logo: "/work/chessever/01-featured.jpg",
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
