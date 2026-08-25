/**
 * How one pixel is drawn, for every renderer in the language.
 *
 * These lived inside glyph-cell.tsx while the canvas was the only thing that
 * drew a pixel. Two renderers only make one language if they draw from the same
 * numbers, so they live here now: tuning the field retunes every icon, and
 * nothing can quietly disagree.
 */

/* How much of its cell a pixel fills, and how far its corners are turned. The
   gap is deliberate and is most of the character: at 1 the field becomes a
   solid sheet, and the language stops being a matrix at all. */
export const PIXEL_FILL = 0.74;
export const PIXEL_ROUNDING = 0.26;

/** What an unlit pixel is still worth. Dark, but present — an LED, not a hole. */
export const PIXEL_FLOOR = 0.16;

export type PixelGeometry = {
  /** The drawn side of the pixel. */
  side: number;
  /** Corner radius. */
  radius: number;
  /** Inset from the cell's edge, so the pixel sits centred in its cell. */
  offset: number;
};

/** The geometry one pixel is given inside a cell of `cell` units. */
export function pixelGeometry(cell: number): PixelGeometry {
  const side = cell * PIXEL_FILL;
  return { side, radius: side * PIXEL_ROUNDING, offset: (cell - side) / 2 };
}
