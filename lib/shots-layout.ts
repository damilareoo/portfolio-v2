import { PITCH } from "@/lib/glyph/panel";

/**
 * How far each column is pushed down, in whole cells.
 *
 * Whole cells, deliberately. A drift measured in pixels I happened to like is
 * arbitrary, and arbitrary is the opposite of placed; quantised to the pitch,
 * every shot on the page sits on the same invisible matrix.
 */
export const DRIFT = [0, 4, 1, 6];

/**
 * A column's width in cells, at the page's full measure: the 1320px container
 * less its two 24px gutters, less three 21px gaps, over four columns, over the
 * pitch.
 *
 * It exists so a column's running height and its drift can be counted in the
 * same unit. They could not be before: the drift went in as pixels and each
 * shot added a bare aspect ratio — around 0.7 against a 28, so the first column
 * stayed the shortest for the first hundred-odd shots and took every one of
 * them. Ten shots in, that is one column and three empty ones.
 *
 * A shot's height in cells is this times its aspect ratio, which is exact only
 * at the full measure — the drift is a fixed pixel offset while the shots
 * scale, so no single number is right at every width. Balance is a heuristic
 * here, and the full measure is the width worth being right at.
 */
export const COLUMN_CELLS = Math.round((1320 - 48 - 63) / 4 / PITCH);

/** The grid renders two columns below `lg` and four from it. */
export const COLUMNS_NARROW = 2;
export const COLUMNS_WIDE = 4;

/**
 * Tailwind's `lg`, written out so the buckets and the grid cannot disagree.
 *
 * The columns are filled in JavaScript and drawn by CSS, and if those two
 * disagree about where the breakpoint is there is a band of widths where the
 * page renders four buckets into two tracks — the shots wrap, and the order
 * they were sorted into stops being the order they are read in.
 */
export const WIDE_QUERY = "(min-width: 1024px)";

type Shaped = { width: number; height: number };

/**
 * Fill shortest-first, so the tops stagger by the drift while the bottoms come
 * out roughly level.
 */
export function bucketShots<T extends Shaped>(shots: readonly T[], columns: number): T[][] {
  const buckets: T[][] = Array.from({ length: columns }, () => []);
  const heights = Array.from({ length: columns }, (_, c) => DRIFT[c % DRIFT.length]);

  for (const shot of shots) {
    let c = 0;
    for (let k = 1; k < columns; k++) if (heights[k] < heights[c]) c = k;
    buckets[c].push(shot);
    heights[c] += COLUMN_CELLS * (shot.height / shot.width);
  }
  return buckets;
}
