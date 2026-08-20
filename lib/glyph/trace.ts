/**
 * The day's line: a walk as long as the day was, folded to fit a card.
 *
 * This is not a route and must never be presented as one. Nothing here knows
 * where anybody went — there is no GPS on this site and no intention of adding
 * any. What the line encodes is the one thing that is actually known: how far
 * the day went. A longer day draws a longer, more wandering line.
 *
 * It is deterministic in the date, so a given day always draws the same figure.
 * That is the property that makes it a record rather than a decoration: come
 * back tomorrow and Tuesday still looks like Tuesday.
 */

export type Point = { x: number; y: number };

/** How many steps one segment of the line stands for. */
const STEPS_PER_SEGMENT = 150;
const MIN_SEGMENTS = 18;
const MAX_SEGMENTS = 150;

/* Where the line stops wandering and starts finding its way home, and how
   hard it is pulled. A run ends where it began often enough that a line which
   never closed would read as a mistake. */
const HOMEWARD_AT = 0.5;
const HOMEWARD_PULL = 0.34;

/* Turn momentum, and how fast it decays. Together they set the handwriting.
   A larger impulse knots the line back through itself; this is tuned to the
   loosest hand that still closes reliably. */
const TURN_IMPULSE = 0.5;
const TURN_DAMPING = 0.82;

/** A small, fast, well-distributed PRNG. Deterministic in its seed, which is
    the whole point — the same day has to draw the same line forever. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over the date, so the seed is stable across machines and deploys. */
function seedOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** How many segments a day's walking is worth. */
export function segmentsFor(steps: number): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0;
  const raw = Math.round(steps / STEPS_PER_SEGMENT);
  return Math.min(MAX_SEGMENTS, Math.max(MIN_SEGMENTS, raw));
}

/**
 * The line for a day, as points in a 0..1 box.
 *
 * Normalised to its own extent and fitted to the box's shorter side, so the
 * figure keeps its proportions and fills the card whatever shape it came out.
 * A day with no steps has no line, and returns none rather than a dot.
 */
export function traceFor(date: string, steps: number): Point[] {
  const segments = segmentsFor(steps);
  if (segments === 0) return [];

  const random = mulberry32(seedOf(date));
  const points: Point[] = [{ x: 0, y: 0 }];
  let heading = random() * Math.PI * 2;
  let turn = 0;

  for (let i = 0; i < segments; i++) {
    turn = turn * TURN_DAMPING + (random() - 0.5) * TURN_IMPULSE;
    heading += turn;

    /* Past the turn for home the heading is bent toward the start, a little
       more on every segment, so the line closes without ever snapping to it. */
    const progress = i / segments;
    if (progress > HOMEWARD_AT) {
      const here = points[points.length - 1];
      const home = Math.atan2(-here.y, -here.x);
      let delta = ((home - heading + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const eased = (progress - HOMEWARD_AT) / (1 - HOMEWARD_AT);
      heading += delta * HOMEWARD_PULL * eased;
    }

    const last = points[points.length - 1];
    points.push({ x: last.x + Math.cos(heading), y: last.y + Math.sin(heading) });
  }

  return fit(points);
}

/** Scale and centre a walk into the unit box, keeping its proportions. */
function fit(points: Point[]): Point[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const span = Math.max(width, height) || 1;
  const offsetX = (span - width) / 2;
  const offsetY = (span - height) / 2;

  return points.map((p) => ({
    x: (p.x - minX + offsetX) / span,
    y: (p.y - minY + offsetY) / span,
  }));
}

/** The line as an SVG path, laid into a box of `size` with `pad` around it. */
export function tracePath(points: Point[], size: number, pad: number): string {
  if (points.length === 0) return "";
  const inner = size - pad * 2;
  return points
    .map((p, i) => {
      const x = (pad + p.x * inner).toFixed(2);
      const y = (pad + p.y * inner).toFixed(2);
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}
