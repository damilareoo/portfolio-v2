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

/**
 * How far a single correction is allowed to move an image's midtone.
 *
 * Outside this the exponent has stopped centring the picture and started
 * inventing contrast that is not in it: a frame whose body sits above 0.84 or
 * below 0.16 after levelling is one the panel cannot rescue, and pushing
 * further would separate noise rather than tone. Clamping leaves such a frame
 * visibly dark or visibly pale, which is the truth about it.
 */
const GAMMA_MIN = 0.4;
const GAMMA_MAX = 3;

/**
 * Puts the body of a levelled frame in the middle of the panel's range.
 *
 * `autoLevel` fixes the frame's *extent* — it guarantees the picture spans 0 to
 * 1 — and says nothing about where inside that span the picture actually sits.
 * For most sources those are the same problem. For a low-key photograph they
 * are not: measured on the About portrait, a night shot at a table, the levelled
 * cell values have a median of 0.731 and pile 32% of the panel into a single
 * brightness step at the top. The extent is correct and the picture is still a
 * slab, because a third of the emitters are all saying the same thing.
 *
 * The correction is one exponent, and the frame chooses it. `v ** γ` with
 * `γ = ln(0.5) / ln(median)` is the power that lands the median exactly at the
 * middle of the range, whatever the median happens to be — so this is not a
 * constant tuned against one photograph, it is a property asked of every frame
 * it is given. An image already centred gets `γ = 1` and passes through
 * untouched.
 *
 * Measured on that portrait at both the wide and narrow cell counts: the top
 * step falls from 32% of the panel to 17%, and the busiest step goes from 13x
 * the quietest to 3.5x. Same ten steps in use either way — `CEIL` decides that
 * — but the picture is now spread across them instead of stacked on the last
 * one.
 *
 * Opt-in, and deliberately not folded into `panelFrom`. The panel's constants
 * are shared with every shot and case frame on the site and were settled in
 * phase 1; a caller with a photograph that needs this asks for it, and every
 * existing sweep renders byte-for-byte what it rendered before.
 */
export function centreMidtone(frame: Float32Array): Float32Array {
  if (frame.length === 0) return frame;

  const sorted = Float32Array.from(frame).sort();
  const median = sorted[Math.round(0.5 * (sorted.length - 1))];
  /* A median at either end has no logarithm to take, and nothing to centre:
     the frame is uniformly dark or uniformly pale and an exponent cannot make
     it otherwise. */
  if (!(median > 0 && median < 1)) return frame;

  const gamma = Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, Math.log(0.5) / Math.log(median)));
  const out = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    const v = frame[i];
    out[i] = v <= 0 ? 0 : v >= 1 ? 1 : Math.pow(v, gamma);
  }
  return out;
}
