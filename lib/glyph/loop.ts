/**
 * One frame loop, self-terminating.
 *
 * Law 4: a page at rest holds no running animation. The loop stops the moment
 * `step` reports nothing left in flight, and anything that wants motion calls
 * `run()` — a no-op while a frame is already booked, so there is only ever one.
 */

export type Loop = { run: () => void; stop: () => void };

export function createLoop(step: (now: number) => boolean): Loop {
  let frame: number | null = null;

  const tick = (now: number) => {
    // The booked id is held across the step, so a `run()` from inside it — a
    // pointer move landing mid-frame — cannot start a second loop.
    frame = step(now) ? requestAnimationFrame(tick) : null;
  };

  return {
    run() {
      if (frame !== null) return;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
