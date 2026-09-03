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
 *
 * Its only consumer is `lib/glyph/sweep.ts` — the image dissolve on shots and
 * case frames — and its numbers are its own. It does not draw the dot language:
 * `lib/glyph/pixel.ts` holds that, and this file imports nothing from it. The
 * separation is on purpose, and `FLOOR` is where it shows. The field's floor is
 * two numbers because the field has a resting state a skin has to govern; this
 * panel has none. It exists only for the length of a sweep, is cleared at the
 * end of it, and reads its ink fresh on every run — so a single floor is not an
 * oversight here, it is the whole of what a transient surface needs.
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

/** The front runs down and slightly right, so it crosses rather than falls. */
export const SKEW = 0.22;

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

/**
 * Where a frame sits, in page coordinates, and how big it is.
 *
 * Page coordinates rather than viewport ones because the wavefront is a
 * page-wide thing: one front crosses every shot on the screen, so each panel
 * has to be able to say where it stands relative to the others. It also makes
 * the box scroll-invariant, which is what lets it be measured once per sweep
 * instead of once per tile per frame.
 */
export type PanelBox = { width: number; height: number; originX: number; originY: number };

/**
 * Sixteen scratch buffers of cell centres, one per brightness step.
 *
 * Reused across calls rather than allocated per frame: a sweep repaints every
 * visible panel sixty times a second, and thirty shots' worth of fresh arrays
 * per frame is garbage the animation would have to stop for. Safe because
 * painting is synchronous and never reentrant — a call fills these and is done
 * with them before the next one begins.
 */
const scratch: number[][] = Array.from({ length: STEPS }, () => []);

/**
 * Draw a panel with the front standing at `front`, in page coordinates.
 *
 * One fill per brightness step, not one per emitter. A panel drives sixteen
 * levels and no more, so every cell at a given level can be collected into one
 * path and laid down in a single fill — a field of thirteen hundred emitters
 * costs sixteen fills instead of thirteen hundred. That is the difference
 * between a page of ten shots and a page of thirty sharing one wavefront: the
 * arcs are cheap, and it was the state changes and the rasterisation around
 * each one that were not.
 */
export function paintPanel(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  box: PanelBox,
  front: number,
  band: number,
  ink: string,
): void {
  const { cols, rows, values } = panel;
  const cw = box.width / cols;
  const ch = box.height / rows;
  const radius = (Math.min(cw, ch) * FILL) / 2;

  ctx.clearRect(0, 0, box.width, box.height);
  ctx.fillStyle = ink;
  for (const level of scratch) level.length = 0;

  for (let y = 0; y < rows; y++) {
    const cy = y * ch + ch / 2;
    const pageY = box.originY + y * ch;
    for (let x = 0; x < cols; x++) {
      const along = pageY + (box.originX + x * cw) * SKEW;
      const alpha = emitter(values[y * cols + x], (front - along) / band);
      const level = Math.round(alpha * (STEPS - 1));
      if (level <= 0) continue;
      const bucket = scratch[level];
      bucket.push(x * cw + cw / 2, cy);
    }
  }

  for (let level = 1; level < STEPS; level++) {
    const bucket = scratch[level];
    if (!bucket.length) continue;
    ctx.globalAlpha = level / (STEPS - 1);
    ctx.beginPath();
    /* Each emitter opens its own subpath. Without the moveTo, arc() joins the
       previous one with a straight line and the fill picks up the joins. */
    for (let i = 0; i < bucket.length; i += 2) {
      ctx.moveTo(bucket[i] + radius, bucket[i + 1]);
      ctx.arc(bucket[i], bucket[i + 1], radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
