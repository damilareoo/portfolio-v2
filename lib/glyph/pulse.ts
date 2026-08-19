/**
 * The playhead pulse: arithmetic on a playback position, and nothing more.
 *
 * This is not beat detection, and it is not tempo. Spotify's `audio-features`
 * and `audio-analysis` endpoints answer 403 for this application, so there is
 * no tempo, no beat grid and no waveform to be had — only where the playhead
 * is. What this module does is divide that position into fixed periods and say
 * when one has been crossed. A ring on every period of a track playing at any
 * speed is an honest metronome against the clock, and claiming otherwise would
 * be a lie the code could not back up.
 *
 * `fingerprint` is the other half: a pulse has to come from somewhere, and the
 * frame the field is holding is the only thing on hand that differs between
 * one track and the next.
 */

/** Where inside the current period the playhead sits, 0 to 1. */
export function pulsePhase(progressMs: number, periodMs: number): number {
  return (progressMs % periodMs) / periodMs;
}

/**
 * How many period boundaries the playhead crossed between two readings.
 *
 * A seek backwards is not a run of pulses played in reverse — it is a jump,
 * and a jump owes nothing. Hence the clamp.
 */
export function pulsesBetween(prevMs: number, nowMs: number, periodMs: number): number {
  return Math.max(0, Math.floor(nowMs / periodMs) - Math.floor(prevMs / periodMs));
}

/**
 * Where a frame's light gathers, and how much of it there is.
 *
 * The centroid is in grid coordinates — column, row — so a caller that knows
 * its cell size can put a ripple exactly where the artwork is brightest. A
 * frame with no light has no centroid to speak of, so it falls back to the
 * middle of the field rather than dividing by zero.
 */
export function fingerprint(frame: Float32Array): { centre: [number, number]; density: number } {
  const grid = Math.round(Math.sqrt(frame.length));
  let sum = 0;
  let sx = 0;
  let sy = 0;

  for (let i = 0; i < frame.length; i++) {
    const v = frame[i];
    if (v <= 0) continue;
    sum += v;
    sx += (i % grid) * v;
    sy += Math.floor(i / grid) * v;
  }

  const middle = (grid - 1) / 2;
  return {
    centre: sum > 0 ? [sx / sum, sy / sum] : [middle, middle],
    density: frame.length > 0 ? sum / frame.length : 0,
  };
}
