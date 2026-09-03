/**
 * How one pixel is drawn, for every renderer that draws the *language*.
 *
 * These lived inside glyph-cell.tsx while the canvas was the only thing that
 * drew a pixel. Two renderers only make one language if they draw from the same
 * numbers, so they live here now: tuning the field retunes every icon, and
 * nothing can quietly disagree. The renderers meant are GlyphCell's canvas and
 * the two SVG ones, GlyphIcon and GlyphText.
 *
 * `lib/glyph/panel.ts` is deliberately not among them. It drives a photograph
 * onto its own transient lattice at its own pitch, fill and floor, and imports
 * nothing from here — see its header for why that separation is right. Worth
 * saying out loud now that the pixel is a circle: the two used to disagree on
 * shape as well as size, which made the separation obvious on sight. It is
 * only visible in the numbers today.
 */

/* How much of its cell a pixel fills, and how far its corners are turned. The
   gap is deliberate and is most of the character: at 1 the field becomes a
   solid sheet, and the language stops being a matrix at all.

   The rounding is a half, which is to say a pixel is a circle. An LED is round,
   and one language draws one shape: `GlyphCell` already drew a true arc on its
   `pixel="round"` path, and this is what brings the square path and the two SVG
   renderers — GlyphIcon, GlyphText — to the same pixel rather than a rounded
   square that nearly matches it.

   The fill went up with the rounding, and had to. A circle inscribed in a
   square keeps only π/4 of its area, so turning the corners the rest of the way
   at a fill of 0.74 would have thinned every icon and numeral by a fifth —
   which is a legibility change dressed up as a shape change. At 0.82 the drawn
   ink lands within a few percent of the square it replaces, and the cell still
   keeps most of a fifth of itself as gap, so the lattice stays a matrix.

   The dotted rules in app/globals.css used to be drawn on this same number and
   no longer are. Their dash is a square and owes no π/4 tax, so handing them
   the compensation would have closed their gap for a cost they do not pay. They
   hold the old 0.74 under their own name, `--rule-fill`, which is what leaves
   this constant free to move. pixel.test.ts holds that seam open. */
export const PIXEL_FILL = 0.82;
export const PIXEL_ROUNDING = 0.5;

/**
 * What an unlit pixel is worth when the skin has not said.
 *
 * The floor stopped being one number, and the reasoning that made it one was
 * right: an unlit cell is an LED, not a hole — present rather than absent, so
 * the lattice is still there behind whatever is lit. That is preserved here,
 * not discarded. What one number could not carry is that presence costs a
 * different amount of ink on each ground. On the dark skin an unlit dot is
 * light ink at low alpha over near-black, and near-black still reads as a
 * surface, so very little buys it. On the light skin it is dark ink over
 * near-white, and the same small number leaves the field genuinely empty —
 * no panel, only the marks.
 *
 * So there are two floors, read from the skin the way every other colour on
 * this site is read: `--pixel-floor` in app/globals.css, higher in `:root` and
 * lower in `.dark`. This constant is what a renderer falls back to when the
 * property is not there to be read — a test environment with no stylesheet,
 * chiefly — and it carries the light value, because a document with no
 * stylesheet on it has no `.dark` on it either.
 */
export const PIXEL_FLOOR = 0.1;

export type PixelGeometry = {
  /** The drawn side of the pixel. */
  side: number;
  /** Corner radius. At half the side, that is a circle. */
  radius: number;
  /** Inset from the cell's edge, so the pixel sits centred in its cell. */
  offset: number;
};

/** The geometry one pixel is given inside a cell of `cell` units. */
export function pixelGeometry(cell: number): PixelGeometry {
  const side = cell * PIXEL_FILL;
  return { side, radius: side * PIXEL_ROUNDING, offset: (cell - side) / 2 };
}
