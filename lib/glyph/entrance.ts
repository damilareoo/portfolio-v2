/**
 * The arrival: a wavefront that opens the field once and is never seen again.
 *
 * Law 4 permits motion on arrival, and this is the whole of what that clause
 * buys — a mask, not an animation. The field's real frame is already correct
 * before the first pixel is drawn; the sweep only decides how much of it is
 * visible yet. That distinction is the reason the mask is a pure function of
 * `t`: nothing here holds state, so nothing here can keep moving after the
 * arrival is over.
 *
 * It travels outward from the centre because that is where a reader is already
 * looking. A wave that broke from a corner would ask the eye to track it.
 */

/** How wide the wavefront is, as a fraction of the field's radius. */
const BAND = 0.35;

/** Hermite, clamped — an edge with no corners on it at either end. */
function smoothstep(edge: number): number {
  if (edge <= 0) return 0;
  if (edge >= 1) return 1;
  return edge * edge * (3 - 2 * edge);
}

/**
 * A radial wavefront over a `grid`×`grid` field at time `t`, 0 to 1.
 *
 * Multiply a frame by this and the frame arrives; the mask itself carries no
 * value. It is 0 everywhere at `t=0` and 1 everywhere at `t=1` — both exactly,
 * so the last frame of the arrival is the frame the field goes on holding and
 * there is no seam where the sweep hands over.
 *
 * The front is launched a band-width behind the centre and lands a band-width
 * beyond the far corner, which is what makes both ends exact rather than
 * merely close. Being monotonic in `t`, it can only ever open.
 */
export function sweepMask(grid: number, t: number): Float32Array {
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const front = clamped * (1 + 2 * BAND) - BAND;

  const middle = (grid - 1) / 2;
  /* The corner is the farthest cell from the centre, so it sets the scale. A
     single-cell field has no distance to speak of and would divide by zero. */
  const reach = Math.hypot(middle, middle);

  const mask = new Float32Array(grid * grid);
  for (let i = 0; i < mask.length; i++) {
    const dx = (i % grid) - middle;
    const dy = Math.floor(i / grid) - middle;
    const distance = reach > 0 ? Math.hypot(dx, dy) / reach : 0;
    mask[i] = smoothstep((front - distance) / BAND);
  }
  return mask;
}
