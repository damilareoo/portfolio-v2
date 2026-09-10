import { PITCH } from "@/lib/glyph/panel";

/**
 * The cadence /shots is composed on.
 *
 * What this replaces: four independently balanced columns, packed
 * shortest-first so their bottoms ended level. That arrangement was correct
 * and it was the wrong problem. Ten shots in four columns at the page's
 * 1272px measure put every photograph at 302px wide — measured, on the live
 * page — so a screenshot of an interface arrived as a grey rectangle with the
 * shape of an interface in it. Packing cannot fix that. Only fewer frames per
 * row can.
 *
 * So the feed is no longer packed at all. It is cut into runs, and a run holds
 * either one shot across the whole measure or two sharing it unequally. The
 * runs alternate, which is what gives the page a beat rather than a texture:
 * a photograph large enough to hold the screen, two smaller ones to read
 * across, then another large one. Below `lg` there are no runs — every shot
 * takes the full width, because a phone splitting into halves is the 302px
 * problem again at a smaller size.
 *
 * Everything here is a pure function of position in the feed. Nothing is
 * random and nothing consults the viewport, so the server and the browser
 * compose the same page; `shots-layout.test.ts` holds that.
 */

/**
 * The measure, in tracks.
 *
 * Twelve rather than two, because a run has to be divisible unequally. Halves
 * are what the old grid already was — a row of equal frames with a gutter down
 * the middle is a wall of thumbnails whatever its column count.
 */
export const TRACKS = 12;

/**
 * The two halves of a run that holds two shots.
 *
 * Seven and five, out of twelve, is a difference of a sixth of the measure —
 * 208px at full width. That is far enough apart to read as a decision from
 * across the room, and close enough that the smaller frame is still a
 * photograph rather than a footnote to its neighbour.
 */
export const PAIR_WIDE = 7;
export const PAIR_NARROW = 5;

/** The gutter inside a run, in cells. Three, the same gap the field always had. */
export const GUTTER_CELLS = 3;

/**
 * How far the narrow half of a run is pushed down, in whole cells.
 *
 * The drift is what keeps two frames in a run from reading as a table row. It
 * goes on the smaller frame every time and never on the larger one: a small
 * frame sitting low beside a big one reads as composed, and a big one sitting
 * low beside a small one reads as a layout that failed.
 *
 * Whole cells, like the old column drift, because the unit is the matrix pitch
 * the panels are drawn on — a frame offset by a fraction of a cell is offset
 * against nothing.
 *
 * Three values, so a page with three runs of two never repeats one. Their size
 * is bounded by the invariant below and checked against the real feed.
 */
export const PAIR_DRIFT = [7, 12, 4];

/**
 * The narrowest width the two-up runs at, and the page's gutter there.
 *
 * `lg` is where `shots-field.tsx` switches the grid from one track to twelve,
 * and 48px is `main`'s `sm:px-6`, both sides. They live here because the
 * invariant below is measured at exactly that width — it is the worst case,
 * since every frame in a run only gets wider (and so taller) above it.
 */
export const WIDE_MIN = 1024;
export const PAGE_PAD = 48;

/**
 * The height in cells of a frame filling `span` tracks, at the narrowest width
 * a run is ever drawn, for a shot of the given aspect ratio.
 *
 * This is the arithmetic the first staggered field got wrong, written down
 * once. That version compared a drift measured in cells against a bare aspect
 * ratio — two different units — and the first column stayed permanently
 * "shortest" and swallowed the feed. Nothing renders through this function;
 * the test does, and that is the point. The unit conversion is stated in one
 * place so the invariant and the constants above cannot drift apart.
 */
export function slotCells(span: number, aspect: number): number {
  const measure = WIDE_MIN - PAGE_PAD - GUTTER_CELLS * PITCH;
  return (measure * (span / TRACKS)) / aspect / PITCH;
}

/** Where one shot sits in its run. */
export type Placement = {
  /** How many of the twelve tracks the frame takes. */
  span: number;
  /** Which track it starts on, counted from 1 the way CSS grid counts. */
  start: number;
  /** How far it is pushed down the run, in whole cells. */
  drift: number;
};

/**
 * Tailwind only emits a class it has read in a source file, so the five
 * placements the cadence can produce are written out rather than built from
 * `place.span`. Keyed span/start, which is the whole of a placement's identity
 * on the horizontal axis.
 *
 * All five are `lg:` prefixed and none of them has an unprefixed counterpart:
 * below `lg` the grid has one track and every frame fills it, so the narrow
 * layout needs no class at all.
 */
export const TRACK_CLASS: Record<string, string> = {
  "12/1": "lg:col-start-1 lg:col-span-12",
  "7/1": "lg:col-start-1 lg:col-span-7",
  "5/8": "lg:col-start-8 lg:col-span-5",
  "5/1": "lg:col-start-1 lg:col-span-5",
  "7/6": "lg:col-start-6 lg:col-span-7",
};

export function trackClass(place: Placement): string {
  return TRACK_CLASS[`${place.span}/${place.start}`] ?? "";
}

/**
 * Cut the feed into runs and place every shot in one.
 *
 * Order is never touched. The feed arrives newest first and a reader reads it
 * newest first, left to right, top to bottom — so within a run of two the
 * earlier shot is always the left-hand frame, and what alternates is which
 * side is the wide one. Reordering to make a run balance would be the layout
 * quietly rewriting the chronology.
 *
 * A run of two needs two shots. When the feed runs out mid-cadence the last
 * shot takes the whole measure instead of standing as a lone half-width frame,
 * which is both the better composition and the only one that does not leave a
 * hole where its partner would have been.
 */
export function composeShots<T>(shots: readonly T[]): { shot: T; place: Placement }[] {
  const placed: { shot: T; place: Placement }[] = [];
  let index = 0;
  let run = 0;
  let pair = 0;

  while (index < shots.length) {
    const twoUp = run % 2 === 1 && index + 1 < shots.length;

    if (!twoUp) {
      placed.push({ shot: shots[index++], place: { span: TRACKS, start: 1, drift: 0 } });
    } else {
      const wideLeft = pair % 2 === 0;
      const drift = PAIR_DRIFT[pair % PAIR_DRIFT.length];
      const left: Placement = wideLeft
        ? { span: PAIR_WIDE, start: 1, drift: 0 }
        : { span: PAIR_NARROW, start: 1, drift };
      const right: Placement = wideLeft
        ? { span: PAIR_NARROW, start: PAIR_WIDE + 1, drift }
        : { span: PAIR_WIDE, start: PAIR_NARROW + 1, drift: 0 };
      placed.push({ shot: shots[index++], place: left });
      placed.push({ shot: shots[index++], place: right });
      pair++;
    }

    run++;
  }

  return placed;
}
