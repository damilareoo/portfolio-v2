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
 * Normalises a frame to its own darkest and brightest values.
 *
 * Album covers arrive in every register: a black metal sleeve may live inside
 * the bottom fifth of the scale and a washed-out one inside the top third. A
 * fixed mapping renders the first as an almost-empty field and the second as
 * an almost-full one, and in both cases the picture is there but the contrast
 * that carries it is not. Levelling each cover against itself is what lets a
 * stranger recognise the sleeve instead of admiring the texture.
 */
export function autoLevel(frame: Float32Array): Float32Array {
  if (frame.length === 0) return frame;

  let min = frame[0];
  let max = frame[0];
  for (const v of frame) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min;
  if (range < FLAT) return frame;

  const out = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) out[i] = (frame[i] - min) / range;
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
