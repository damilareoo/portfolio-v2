/**
 * Roles, as recorded on LinkedIn. Newest first.
 *
 * Newest first is how a CV is written and it is not how the site reads them:
 * /about draws these on a time axis, earliest first, and works out for itself
 * which of them ran at the same time. Order here is the record's own; order
 * there is derived. See `lib/experience.ts` — nothing outside that file parses
 * a `period`.
 *
 * `logo` is the artwork the company supplied or publishes, so the mark carries
 * the company's own drawing rather than something invented here. `mark` is the
 * second half of that, and the two are not the same claim: a `logo` is a file,
 * a `mark` says what kind of drawing is in it and gives the site the numbers it
 * needs to set that kind at the size of the type beside it. Only a role with
 * both can stand as an image; a role with neither is set in the site's own mono.
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
  /** Set only where `logo` is the company's real artwork. See `Mark`. */
  mark?: Mark;
};

/**
 * What kind of drawing the `logo` file holds.
 *
 * Two kinds, because two kinds of artwork arrive and they are not measured the
 * same way. A **wordmark** spells the company's name, so its size is its cap
 * height and the site can set it to the cap height of the type around it. A
 * **symbol** spells nothing, so it has no cap height to be set from, and its
 * size comes from its own box instead. Overloading `cap` to carry both would
 * make it a lie on half the marks; a discriminant makes the next company that
 * arrives say which it brought.
 *
 * The kind decides the treatment, not only the arithmetic. A wordmark is
 * cropped out of its plate and framed; a symbol is set beside the company's
 * name in the site's own mono, because a bare shape does not say who it is.
 * See `components/company-marks.tsx`.
 */
export type Mark = Wordmark | SymbolMark;

/**
 * Where a company's wordmark actually sits inside its `logo`.
 *
 * An OG plate is mostly margin, and the margin is not the same on any two of
 * them. Endgame's wordmark is 75px tall on a 630px plate and HEX's is 137px,
 * so setting both plates to one box would print one company's name at nearly
 * twice the other's — names at several sizes, which reads as several levels of
 * importance rather than several facts. These numbers are what let each plate
 * be scaled until the wordmarks share a cap height, and share it with the name
 * beside ChessEver's symbol, which is set in type at that same cap.
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
 */
export type Wordmark = {
  kind: "wordmark";
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

/**
 * A mark that is a shape rather than a name: the whole file is the artwork.
 *
 * There is nothing here to locate, which is the point of the second kind. A
 * symbol has no plate to crop it out of, no ground to hide and no clear space
 * that belongs to someone else's layout — ChessEver's file is the mark, edge to
 * edge, on a genuinely transparent ground. So the only figure recorded is the
 * box the file arrives in, and that is here so the aspect ratio is read off the
 * file rather than retyped beside it.
 *
 * No size figure, deliberately. How large a symbol should print next to type is
 * a judgement about how the two read together, not a measurement of this file,
 * so it is made once for every symbol in `components/company-marks.tsx` rather
 * than per company here.
 *
 * Presence is still the switch. A role with no `mark` has no artwork the site
 * can use, whatever `logo` happens to point at, and its name is set in mono
 * instead of cropping product art into the shape of a logo.
 */
export type SymbolMark = {
  kind: "symbol";
  /** The file's pixel dimensions, as it carries them. */
  box: [width: number, height: number];
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
    mark: {
      kind: "wordmark",
      plate: [1200, 630],
      cap: 75 / 630,
      width: 596 / 630,
      height: 108 / 630,
    },
  },
  {
    role: "Product Designer",
    company: "ChessEver",
    url: "https://chessever.com",
    period: "Apr 2025 — Apr 2026",
    location: "United States · Remote",
    engagement: "Contract",
    /* The real mark, supplied by the company, which is what the empty field
       here was waiting for. It briefly pointed at `/work/chessever/01-featured.jpg`
       — a product screenshot — because the About ladder had a box to fill and
       that was the only ChessEver picture the repo held; that was a claim the
       site could not make, and the field was emptied rather than left lying.
       The screenshot is still in `data/work.ts`, where it is what it is.

       A symbol rather than a wordmark, so it declares that and carries its box
       instead of a cap height it has not got. */
    logo: "/companies/chessever.png",
    mark: { kind: "symbol", box: [501, 500] },
  },
  {
    role: "Design Partner",
    company: "HEX",
    url: "https://hex.inc",
    period: "Mar 2025 — Apr 2026",
    location: "San Francisco, California · Remote",
    engagement: "Contract",
    logo: "/companies/hex.png",
    mark: {
      kind: "wordmark",
      plate: [1200, 630],
      cap: 137 / 630,
      width: 380 / 630,
      height: 137 / 630,
    },
  },
];
