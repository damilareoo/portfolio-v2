import { afterEach, describe, expect, it, vi } from "vitest";
import { createLoop } from "./loop";

/**
 * A hand-cranked frame clock. Nothing runs until the test says so, which is the
 * only way to assert that a loop has genuinely stopped rather than merely gone
 * quiet for a while.
 */
function frameClock() {
  const booked = new Map<number, (now: number) => void>();
  let nextId = 1;

  vi.stubGlobal("requestAnimationFrame", (cb: (now: number) => void) => {
    booked.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    booked.delete(id);
  });

  return {
    get pending() {
      return booked.size;
    },
    /** Fire every frame currently booked. Frames booked during the tick wait. */
    tick(now = 0) {
      const due = [...booked.values()];
      booked.clear();
      for (const cb of due) cb(now);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createLoop", () => {
  it("books one frame however often it is asked to run", () => {
    const clock = frameClock();
    const loop = createLoop(() => true);

    loop.run();
    loop.run();
    loop.run();
    expect(clock.pending).toBe(1);
  });

  it("does not double-book when the step asks to run mid-frame", () => {
    const clock = frameClock();
    let steps = 0;
    const loop: { run: () => void; stop: () => void } = createLoop(() => {
      steps++;
      // A pointer move landing inside the step, the way an event would.
      loop.run();
      return true;
    });

    loop.run();
    clock.tick();
    expect(steps).toBe(1);
    expect(clock.pending).toBe(1);

    clock.tick();
    expect(steps).toBe(2);
    expect(clock.pending).toBe(1);
  });

  it("keeps booking while the step reports work in flight", () => {
    const clock = frameClock();
    let steps = 0;
    const loop = createLoop(() => ++steps < 3);

    loop.run();
    clock.tick();
    expect(clock.pending).toBe(1);
    clock.tick();
    expect(clock.pending).toBe(1);
    clock.tick();

    // Law 4: the third step reported nothing left, so no frame is booked.
    expect(steps).toBe(3);
    expect(clock.pending).toBe(0);
  });

  it("leaves nothing running once the step reports idle", () => {
    const clock = frameClock();
    const loop = createLoop(() => false);

    loop.run();
    clock.tick();
    expect(clock.pending).toBe(0);

    // And stays stopped on its own: no frame reappears without a run().
    clock.tick();
    expect(clock.pending).toBe(0);
  });

  it("runs again after it has stopped itself", () => {
    const clock = frameClock();
    let steps = 0;
    const loop = createLoop(() => {
      steps++;
      return false;
    });

    loop.run();
    clock.tick();
    expect(clock.pending).toBe(0);

    loop.run();
    expect(clock.pending).toBe(1);
    clock.tick();
    expect(steps).toBe(2);
  });

  it("cancels a booked frame on stop", () => {
    const clock = frameClock();
    let steps = 0;
    const loop = createLoop(() => {
      steps++;
      return true;
    });

    loop.run();
    loop.stop();
    expect(clock.pending).toBe(0);

    clock.tick();
    expect(steps).toBe(0);

    // Stopping does not retire the loop — it can be run again.
    loop.run();
    expect(clock.pending).toBe(1);
  });

  it("passes the frame timestamp through to the step", () => {
    const clock = frameClock();
    const seen: number[] = [];
    const loop = createLoop((now) => {
      seen.push(now);
      return seen.length < 2;
    });

    loop.run();
    clock.tick(16);
    clock.tick(32);
    expect(seen).toEqual([16, 32]);
  });
});
