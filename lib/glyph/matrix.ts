/**
 * The matrix: a field of cells, each holding an ink value and a spring.
 *
 * Everything here is pure and geometry-free beyond what it is handed, so the
 * same physics can carry a disc, a counter, or anything else the site grows.
 * Canvas work and the frame loop live elsewhere — this module only integrates.
 *
 * The one import is `pixelGeometry`, and it is here for `fieldReach` rather
 * than for the physics: the lattice decides where a cell stands and the pixel
 * decides how far its ink spreads from there, so the question "how far does
 * this field reach" needs both and can be answered honestly by neither alone.
 */

import { pixelGeometry } from "./pixel";

export type Cell = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  /** Current ink value, and the value it is travelling toward. */
  v: number;
  tv: number;
};

/**
 * A ring struck at a point. `strength` is a multiplier on the force it carries,
 * so a caller with something to say about the ring's size — a bright cover
 * against a dark one — can say it without reaching into `TUNING`.
 */
export type Ripple = { x: number; y: number; born: number; strength?: number };

export type Pointer = { x: number; y: number } | null;

export const TUNING = {
  /* The tile feel spec, applied to a particle: stiffness 400, damping 32. */
  STIFFNESS: 400,
  DAMPING: 32,
  PUSH_RADIUS: 78,
  PUSH_STRENGTH: 30,

  /* The ripple is a travelling ring, not a flash: cells are struck as the front
     passes them, so the field reads as a surface with something moving across it. */
  RIPPLE_SPEED: 320, // units per second
  RIPPLE_WIDTH: 26,
  RIPPLE_STRENGTH: 340,
  RIPPLE_LIFE: 1.3, // seconds

  /* One breath of a pulsing face. */
  PULSE_PERIOD_MS: 2000,
} as const;

/** How far a cell has to be from home before the field counts as moving. */
const AT_REST = 0.05;

/** Below this the value has arrived; holding the difference would never resolve. */
const VALUE_EPSILON = 0.002;

/**
 * Value migration rate, per second — mark into artwork and back.
 *
 * A cross-fade, and tuned as one: at six per second a cell is two thirds of the
 * way to its new value after 170ms and settled after about 400, which is the
 * right length for a disc dissolving between the Spotify mark and a sleeve.
 *
 * It is the wrong length for a field whose frames are a *sequence* rather than
 * two pictures. A walker crossing one cell every hundred milliseconds leaves
 * five cells of itself behind at this rate, and the gait is read through its
 * own ghost. That is what `valueRate` is for — see `stepCells`.
 */
export const VALUE_RATE = 6;

/**
 * How far inside a circular field's edge the lattice stops placing cells, in
 * cells. Named because it is half of the answer to "how far does the ink
 * reach" — see `fieldReach`, which is the other half and the only thing that
 * should ever be asked.
 */
const CIRCLE_INSET = 0.35;

/**
 * How far the ink of a circular field can reach, as a share of the field's own
 * radius. Slightly over 1: the lattice stops short of the edge, and then each
 * pixel is drawn outward from its cell's centre by half its own width, which
 * puts the outermost ink a little past where the cells stop.
 *
 * This exists so that nothing drawn *around* a field has to restate the
 * field's geometry to know where it ends. `now-playing-disc.tsx` held its
 * own guess at this number — one constant for the ring and a second,
 * independently derived, for the disc — and the two were free to disagree,
 * which is exactly what they did: the ring was drawn through the artwork it
 * was meant to sit outside. There is one expression of it now, and it is
 * here, beside the cull that half of it comes from.
 *
 * It is an upper bound rather than a measurement. On a square lattice no cell
 * centre lands exactly on the cull radius, so the true reach is a little less
 * than this for any given grid — which is the direction a caller wants to be
 * wrong in, because the number is used to clear the field rather than to fill
 * it.
 *
 * It says nothing about a field in motion. A ripple or a pointer displaces
 * cells outward by canvas units, and how much of that a caller must leave room
 * for is the caller's own decision about its own ring.
 */
export function fieldReach(grid: number, size: number): number {
  const cellSize = size / grid;
  const radius = size / 2;
  return (radius - cellSize * CIRCLE_INSET + pixelGeometry(cellSize).side / 2) / radius;
}

export function buildCells(grid: number, size: number, shape: "circle" | "square"): Cell[] {
  const cellSize = size / grid;
  const radius = size / 2;
  const cells: Cell[] = [];
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const x = (col + 0.5) * cellSize;
      const y = (row + 0.5) * cellSize;
      if (shape === "circle" && Math.hypot(x - radius, y - radius) > radius - cellSize * CIRCLE_INSET) {
        continue;
      }
      cells.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0, v: 0, tv: 0 });
    }
  }
  return cells;
}

/** Which frame value stands on this cell. Home position, never the offset one. */
export function cellIndex(cell: Cell, grid: number, size: number): number {
  const cellSize = size / grid;
  const col = Math.min(grid - 1, Math.floor(cell.x / cellSize));
  const row = Math.min(grid - 1, Math.floor(cell.y / cellSize));
  return row * grid + col;
}

/**
 * Points every cell at the value standing on it.
 *
 * The geometry is read back off the cells rather than passed in again: the
 * frame's length gives the grid, and a lattice from `buildCells` is centred on
 * its field, so the outermost cell centres sum to the field size.
 */
export function setTargets(cells: Cell[], values: Float32Array): void {
  if (cells.length === 0) return;
  const grid = Math.round(Math.sqrt(values.length));
  let min = cells[0].x;
  let max = cells[0].x;
  for (const cell of cells) {
    if (cell.x < min) min = cell.x;
    if (cell.x > max) max = cell.x;
  }
  const size = min + max;
  for (const cell of cells) cell.tv = values[cellIndex(cell, grid, size)] ?? 0.5;
}

/** Jump straight to the target — first paint, and reduced motion. */
export function settle(cells: Cell[]): void {
  for (const cell of cells) cell.v = cell.tv;
}

/** Home and still. What a field looks like the instant its loop gives up. */
export function recentre(cells: Cell[]): void {
  for (const cell of cells) {
    cell.ox = cell.oy = cell.vx = cell.vy = 0;
  }
}

/** Ripples still within their life at `now`, in the order they were struck. */
export function liveRipples(ripples: Ripple[], now: number): Ripple[] {
  return ripples.filter((ripple) => (now - ripple.born) / 1000 < TUNING.RIPPLE_LIFE);
}

/**
 * One integration step over the whole field.
 *
 * Returns whether anything is still in flight — a value migrating or a cell
 * away from home. A caller that gets `false`, with no pointer and no live
 * ripple, has nothing left to draw and must stop its loop.
 */
export function stepCells(
  cells: Cell[],
  dt: number,
  now: number,
  pointer: Pointer,
  ripples: Ripple[],
  /** How fast a cell travels to the value it has been given, per second.
      Defaulted rather than fixed because the answer depends on what the frames
      are: two pictures want a dissolve, a run of frames wants a cut. */
  valueRate: number = VALUE_RATE,
): boolean {
  let busy = false;

  for (const cell of cells) {
    // Value migration — one frame into the next.
    if (Math.abs(cell.tv - cell.v) > VALUE_EPSILON) {
      cell.v += (cell.tv - cell.v) * Math.min(1, dt * valueRate);
      busy = true;
    } else {
      cell.v = cell.tv;
    }

    let tx = 0;
    let ty = 0;

    if (pointer) {
      const dx = cell.x - pointer.x;
      const dy = cell.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < TUNING.PUSH_RADIUS && dist > 0.001) {
        const falloff = 1 - dist / TUNING.PUSH_RADIUS;
        const push = falloff * falloff * TUNING.PUSH_STRENGTH;
        tx = (dx / dist) * push;
        ty = (dy / dist) * push;
      }
    }

    for (const ripple of ripples) {
      const dx = cell.x - ripple.x;
      const dy = cell.y - ripple.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001) continue;
      const age = (now - ripple.born) / 1000;
      const front = age * TUNING.RIPPLE_SPEED;
      const offset = Math.abs(dist - front);
      if (offset > TUNING.RIPPLE_WIDTH) continue;
      // Struck as the front passes, and fading as the ring travels out.
      const strength =
        (1 - offset / TUNING.RIPPLE_WIDTH) *
        (1 - age / TUNING.RIPPLE_LIFE) *
        TUNING.RIPPLE_STRENGTH *
        (ripple.strength ?? 1);
      cell.vx += (dx / dist) * strength * dt;
      cell.vy += (dy / dist) * strength * dt;
    }

    const ax = TUNING.STIFFNESS * (tx - cell.ox) - TUNING.DAMPING * cell.vx;
    const ay = TUNING.STIFFNESS * (ty - cell.oy) - TUNING.DAMPING * cell.vy;
    cell.vx += ax * dt;
    cell.vy += ay * dt;
    cell.ox += cell.vx * dt;
    cell.oy += cell.vy * dt;

    if (Math.abs(cell.vx) + Math.abs(cell.vy) + Math.abs(cell.ox) + Math.abs(cell.oy) > AT_REST) {
      busy = true;
    }
  }

  return busy;
}
