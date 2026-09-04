/**
 * A CSS `aspect-ratio` string as the bare number `.frame-cap` needs.
 *
 * The cap on a frame's size is written as a max-*width*, because
 * `aspect-ratio` yields to whichever axis is explicitly constrained — cap the
 * height and the box keeps its parent's width and crops instead of shrinking.
 * To turn a height budget into a width the stylesheet needs width ÷ height as
 * a plain number, and CSS cannot divide the two halves of an `aspect-ratio`
 * for itself.
 *
 * Returns null rather than a fallback when the string is not two positive
 * numbers, so a frame with an unparseable ratio renders uncapped exactly as it
 * did before. A wrong number here would size every frame on the page wrongly,
 * and silently: the page would still lay out, just at the wrong scale.
 */
export function frameRatio(aspect: string): number | null {
  const [w, h] = aspect.split("/").map((part) => Number(part.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}
