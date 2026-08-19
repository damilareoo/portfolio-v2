/**
 * Tone: how a frame's values become ink a reader can actually see.
 *
 * A dot grid is a halftone, and a halftone lives or dies on two things — that
 * the darkest part of the picture is allowed to be dark, and that a value
 * halfway up the scale lays down half the ink. Neither is automatic.
 */

/** Below this a frame has no range worth stretching, only noise to amplify. */
const FLAT = 0.004;

/**
 * How much of each tail gets treated as noise rather than signal.
 *
 * A single stuck-black or blown-white pixel is enough to anchor a min/max
 * range, and jacket art is full of exactly that kind of pixel: a spot-gloss
 * fleck, a JPEG ringing artifact at a hard edge, a scanner dust speck. Trim
 * 2% off each end and those outliers land in the clipped region instead of
 * defining the whole scale — generous enough to absorb a handful of stray
 * pixels out of a few thousand, small enough to leave every cover's real
 * tonal body untouched. It sits in the same neighbourhood as the "auto
 * levels" default in mainstream photo editors, chosen for the same reason:
 * cheap insurance against outliers, invisible everywhere else.
 */
const TAIL = 0.02;

/**
 * Normalises a frame to the range that actually carries its picture, not to
 * its literal extremes.
 *
 * Album covers arrive in every register: a black metal sleeve may live inside
 * the bottom fifth of the scale and a washed-out one inside the top third. A
 * fixed mapping renders the first as an almost-empty field and the second as
 * an almost-full one, and in both cases the picture is there but the contrast
 * that carries it is not. Levelling each cover against itself is what lets a
 * stranger recognise the sleeve instead of admiring the texture.
 *
 * Anchoring on the literal min and max is fragile, though: one outlier pixel
 * at each end is enough to make a cover whose bulk sits in a narrow midtone
 * band render just as flat as before, because that bulk still only occupies
 * the sliver of range between two extremes it doesn't represent. Anchoring on
 * a percentile near each end instead — the bottom 2% and top 2% by value,
 * found by sorting — treats a handful of extreme pixels as noise to clip
 * rather than as the frame's true darkest and brightest points, and lets the
 * body of the image claim the range it actually earns. On the tiny arrays
 * this also has to survive (three or four values), 2% of the array rounds
 * down to the endpoints themselves, so the method quietly degrades to plain
 * min/max exactly where "percentile" stops being a meaningful idea.
 */
export function autoLevel(frame: Float32Array): Float32Array {
  if (frame.length === 0) return frame;

  const sorted = Float32Array.from(frame).sort();
  const lowIndex = Math.round(TAIL * (sorted.length - 1));
  const highIndex = sorted.length - 1 - lowIndex;
  const low = sorted[lowIndex];
  const high = sorted[highIndex];

  const range = high - low;
  if (range < FLAT) return frame;

  const out = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    const v = (frame[i] - low) / range;
    out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return out;
}

/**
 * The radius that puts `value` worth of ink inside a cell.
 *
 * Square root, deliberately. The eye integrates the *area* a dot covers, and
 * area goes as the square of the radius — so the obvious `radius = value`
 * mapping lays down `value²` ink and crushes every midtone toward black. Half
 * the luminance should be half the ink, which means `radius = √value`.
 *
 * Zero is zero: an unlit cell draws nothing at all, which is the only way a
 * dark region of a cover is allowed to read as dark.
 */
export function inkRadius(value: number, cell: number): number {
  return Math.sqrt(Math.max(0, Math.min(1, value))) * cell * 0.5;
}
