/**
 * The pedometer's faces, as fields.
 *
 * Three ways of saying the same number. The walk puts today's total on a path
 * and lets distance do the talking; the record states it and names it; the week
 * sets it beside the six days behind it. None of them knows about a canvas, a
 * skin, or React — a face is arithmetic over a grid, and that is why it can be
 * argued with in a test rather than squinted at in a browser.
 *
 * One rule runs underneath all three: a day nobody reported is not a day of no
 * walking. `lib/steps.ts` keeps those apart all the way here, and here is the
 * last place they could be flattened back together.
 */

import { stampText, textWidth } from "./font";
import { emptyFrame } from "./glyphs";
import type { StepsDay } from "@/lib/steps";

/** One dot of the week view. `hollow` is the monochrome word for a missed day. */
export type CellMark = { value: number; hollow: boolean };

/** The dot alphabet is five rows tall; `font.ts` keeps that to itself. */
const GLYPH_ROWS = 5;

const FIGURE_W = 6;
const FIGURE_H = 8;

/**
 * The walker, mid-stride: arms out, one leg planted and one trailing. Drawn as
 * a bitmap here rather than derived from anything, because a figure at five
 * cells wide is a piece of lettering — it is legible or it is not, and the only
 * way to make it legible is to place every dot by hand.
 */
const FIGURE = [
  0, 0, 1, 1, 0, 0,
  0, 0, 1, 1, 0, 0,
  1, 1, 1, 1, 1, 1,
  0, 0, 1, 1, 0, 0,
  0, 0, 1, 1, 0, 0,
  0, 1, 1, 0, 1, 0,
  1, 1, 0, 0, 1, 1,
  1, 0, 0, 0, 0, 1,
];

/** What the path ahead of the walker is worth. Not zero: it is still a path. */
/* The road ahead, dimmer than the ground covered.
   The path is the whole goal laid end to end: the figure's place along it is
   today's share of it, the bright dots behind are what has been walked, and
   the dim ones in front are what is left. A day that met its goal has the
   figure at the end and no road ahead at all — which is not the road being
   absent from the design, but the reading being finished. */
const AHEAD = 0.32;

/** How many dots stand in a week column. Seven, to rhyme with the seven days. */
export const WEEK_ROWS = 7;

/**
 * The value a cell carries when there is nothing to carry — the dot-matrix
 * version of the placeholder digits the counters show before they are read.
 *
 * This is a *value*, not an alpha: the field turns it into ink through whatever
 * floor it is drawing on. It used to be calibrated against a single floor of
 * 0.16 and described as reading "as the field at rest", and that sentence is no
 * longer true anywhere. The field's floor is now the skin's — 0.1 light, 0.05
 * dark — and the pedometer, which is this constant's only caller, draws at
 * `unlit={0}`, so there is no resting lattice here at all. A placeholder cell
 * is the only thing in its cell, read against the card rather than against
 * dots around it.
 *
 * The number is left where it was on purpose. What it should be is a design
 * call about how loudly an unread reading announces itself, and it is not one
 * this file can make alone.
 */
export const UNREPORTED = 0.16;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** 5391 -> "5,391". The grouping is the point: a five-figure day should look it. */
export function groupDigits(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Centres a run of glyphs on the grid, so a number's width never shifts it. */
function stampCentred(frame: Float32Array, grid: number, text: string, top: number): void {
  stampText(frame, grid, text, Math.round((grid - textWidth(text)) / 2), top);
}

export function numberFrame(grid: number, value: number): Float32Array {
  const frame = emptyFrame(grid);
  stampCentred(frame, grid, groupDigits(value), Math.round((grid - GLYPH_ROWS) / 2));
  return frame;
}

/**
 * The record: two readings, each in its own band, with the band beneath it left
 * empty on purpose. The dot alphabet has no letters, so the label that names a
 * number has to be set in type and laid over the gap the number leaves for it.
 *
 * A null reading stamps nothing, and the placeholder field shows through.
 */
export function recordFrame(
  grid: number,
  today: number | null,
  average: number | null,
): Float32Array {
  const frame = emptyFrame(grid);
  if (today !== null) stampCentred(frame, grid, groupDigits(today), Math.round(grid * 0.1));
  if (average !== null) stampCentred(frame, grid, groupDigits(average), Math.round(grid * 0.62));
  return frame;
}

/**
 * The walk. Progress is today against the goal, clamped — a good day carries
 * the figure to the end of the path and no further, because there is no further
 * for it to go and an overshoot would read as a bug rather than an achievement.
 *
 * Ground already covered is full-size and full-brightness; the road ahead is
 * small and dim. That is the whole readout: you can see how far you have come
 * without reading a number, which is what a glanceable instrument is for.
 */
export function walkFrame(grid: number, progress: number, horizon?: number): Float32Array {
  const frame = emptyFrame(grid);

  /* The path is the card's horizon and sits on its middle line; the figure
     stands on it. Centring the pair as one block instead drops the horizon to
     two-thirds down and leaves the card bottom-heavy. A caller with type to fit
     above the walk can push the horizon down to make room for it. */
  const pathRow = Math.min(grid - 1, horizon ?? Math.round((grid - 1) / 2));
  const top = Math.max(0, pathRow - FIGURE_H);
  const left = Math.round(clamp01(progress) * Math.max(0, grid - FIGURE_W));
  const heel = left + (FIGURE_W >> 1);

  for (let col = 0; col < grid; col++) {
    frame[pathRow * grid + col] = col < heel ? 1 : AHEAD;
  }

  for (let row = 0; row < FIGURE_H; row++) {
    for (let col = 0; col < FIGURE_W; col++) {
      if (!FIGURE[row * FIGURE_W + col]) continue;
      const x = left + col;
      const y = top + row;
      if (x < 0 || x >= grid || y < 0 || y >= grid) continue;
      frame[y * grid + x] = 1;
    }
  }

  return frame;
}

/**
 * The week, one column per day, filling from the bottom.
 *
 * Magnitude rides the dots themselves rather than the height of a bar: the
 * topmost dot of a part-filled column is a partial value, so it is smaller and
 * dimmer than the ones under it, and a column reads as a quantity rather than
 * as a step. Whether the goal was met is a separate fact and gets a separate
 * language — filled for met, an open ring for missed. No hue is spent on it.
 *
 * A day nobody reported is neither: it is a column of placeholder dots, which
 * is what the field looks like when it has not been told anything.
 */
export function weekMarks(days: StepsDay[], goal: number): CellMark[][] {
  return days.map((day) => {
    if (day.steps === null) {
      return Array.from({ length: WEEK_ROWS }, () => ({ value: UNREPORTED, hollow: false }));
    }

    const level = goal > 0 ? clamp01(day.steps / goal) * WEEK_ROWS : 0;
    const hollow = day.steps < goal;

    const column: CellMark[] = [];
    for (let row = 0; row < WEEK_ROWS; row++) {
      // Rows come back top-first, so the fill has to be measured from the floor.
      column.push({ value: clamp01(level - (WEEK_ROWS - 1 - row)), hollow });
    }
    return column;
  });
}
