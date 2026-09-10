import { PITCH } from "@/lib/glyph/panel";

/** How far each column is pushed down, in whole cells. */
export const DRIFT = [0, 4, 1, 6];

/**
 * A column's width in cells at the page's full measure. Heights and drift must
 * share a unit: comparing a drift measured in cells to a bare aspect ratio was
 * the original bug — the first column stayed "shortest" and swallowed the feed.
 */
export const COLUMN_CELLS = Math.round((1320 - 48 - 63) / 4 / PITCH);

/** The grid renders two columns below `lg` and four from it. */
export const COLUMNS_NARROW = 2;
export const COLUMNS_WIDE = 4;

/** Kept in lockstep with Tailwind's `lg` breakpoint. */
export const WIDE_QUERY = "(min-width: 1024px)";

type Shaped = { width: number; height: number };

/** Fill the shortest column first, keeping the staggered tops and level ends. */
export function bucketShots<T extends Shaped>(shots: readonly T[], columns: number): T[][] {
  const buckets: T[][] = Array.from({ length: columns }, () => []);
  const heights = Array.from({ length: columns }, (_, c) => DRIFT[c % DRIFT.length]);

  for (const shot of shots) {
    let column = 0;
    for (let candidate = 1; candidate < columns; candidate++) {
      if (heights[candidate] < heights[column]) column = candidate;
    }
    buckets[column].push(shot);
    heights[column] += COLUMN_CELLS * (shot.height / shot.width);
  }

  return buckets;
}
