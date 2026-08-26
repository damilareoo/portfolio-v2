/**
 * A photograph, driven onto the matrix as if it were an LED panel.
 *
 * The distinction this file exists to hold: a halftone varies the SIZE of a dot
 * to carry tone, and a panel does not. An LED cannot grow, so brightness carries
 * the value and every emitter is the same size — which is why `inkRadius` in
 * tone.ts, correct as it is for a halftone, is the wrong instrument here.
 *
 * Three consequences follow, and each is a rule this project already wrote down:
 * the emitter is a constant size; an unlit emitter is still present, because the
 * lattice is the panel's face and not an absence; and the panel drives its
 * emitters in steps rather than continuously, which is what keeps a dot grid
 * from reading as a CSS gradient.
 */
import { autoLevel } from "./tone";

/** Pitch, in CSS pixels. Constant across a page so it reads as one field. */
export const PITCH = 7;

/** Emitter diameter as a fraction of pitch. The gap is most of the character. */
export const FILL = 0.58;

/** Brightness resolution of the panel. */
export const STEPS = 16;

/** What an unlit emitter is still worth: present, not announced. */
export const FLOOR = 0.045;

/** An emitter never reaches full ink. The picture arrives, it does not shout. */
export const CEIL = 0.62;

/** How wide the wavefront is, as a fraction of the viewport. */
export const BAND = 0.26;

export type Panel = {
  cols: number;
  rows: number;
  /** Ink per cell, 0 to 1, already levelled. Row-major. */
  values: Float32Array;
};

/** How many cells a box of `px` CSS pixels earns at the shared pitch. */
export function cellsAcross(px: number): number {
  return Math.max(2, Math.round(px / PITCH));
}

/**
 * Luminance to ink, inverted: a dark pixel lights an emitter.
 *
 * Levelled per shot rather than globally — a photograph that lives in the
 * bottom fifth of the scale would otherwise drive an almost-empty panel, and
 * the picture would be there while the contrast carrying it was not.
 */
export function panelFrom(pixels: Uint8ClampedArray, cols: number, rows: number): Panel {
  const raw = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    const p = i * 4;
    raw[i] = 1 - (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255;
  }
  return { cols, rows, values: autoLevel(raw) };
}

/** Hermite, clamped — the same edge entrance.ts puts on its wavefront. */
export function smoothstep(edge: number): number {
  if (edge <= 0) return 0;
  if (edge >= 1) return 1;
  return edge * edge * (3 - 2 * edge);
}

/** Continuous brightness, rounded to what the panel can actually drive. */
export function quantise(value: number): number {
  const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
  return Math.round(clamped * (STEPS - 1)) / (STEPS - 1);
}

/**
 * What one emitter is worth once the front has passed `lit` of the way over it.
 *
 * At `lit = 0` the panel is on and saying nothing — every emitter sits at the
 * floor. At `lit = 1` it carries the picture. It never carries more than CEIL.
 */
export function emitter(value: number, lit: number): number {
  const target = value * CEIL;
  return quantise(FLOOR + (target - FLOOR) * smoothstep(lit));
}
