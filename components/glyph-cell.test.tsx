// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlyphCell } from "@/components/glyph-cell";

// React has to be told it is inside a test, or every render warns about act().
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GRID = 8;
const SIZE = 80;
const CELLS = GRID * GRID; // A square field draws one arc per cell.

/**
 * jsdom has no 2D context, so the canvas is answered by a recorder. It keeps
 * what it was asked to draw, not just how often: `draw` encodes a cell's value
 * as `0.2 + value * 0.8` alpha and a radius of `value * cellSize * 0.62`, so
 * reading those back says which frame the field actually painted — the one it
 * was handed, or some half-migrated state on the way to it.
 */
function recordCanvas() {
  const painted = { arcs: 0, clears: 0, alphas: [] as number[], radii: [] as number[] };
  const ctx = {
    setTransform: () => {},
    clearRect: () => {
      painted.clears++;
    },
    beginPath: () => {},
    arc: (_x: number, _y: number, r: number) => {
      painted.arcs++;
      painted.radii.push(r);
      painted.alphas.push(ctx.globalAlpha);
    },
    fill: () => {},
    fillStyle: "",
    globalAlpha: 1,
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  return painted;
}

/** The values the first painted frame carried, recovered from its alphas. */
function firstFrameValues(painted: { alphas: number[] }) {
  return painted.alphas.slice(0, CELLS).map((alpha) => (alpha - 0.2) / 0.8);
}

/** Frames only advance when a test says so. */
function frameClock() {
  const booked = new Map<number, (now: number) => void>();
  let nextId = 1;

  vi.stubGlobal("requestAnimationFrame", (cb: (now: number) => void) => {
    booked.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => booked.delete(id));

  return {
    get pending() {
      return booked.size;
    },
    // Frames carry the real clock, so `dt` inside the step is a plausible
    // fraction of a second rather than a jump backwards from `performance.now`.
    tick(now = performance.now()) {
      const due = [...booked.values()];
      booked.clear();
      act(() => {
        for (const cb of due) cb(now);
      });
    },
  };
}

function reducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount(element: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(element));
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GlyphCell", () => {
  it("paints a field driven only by onTick, with no frame prop", () => {
    reducedMotion(false);
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(1);

    mount(<GlyphCell grid={GRID} size={SIZE} frame={null} label="ticking" onTick={() => lit} />);

    // The tick is the field's only source, so it is its own reason to run.
    expect(clock.pending).toBe(1);
    expect(painted.arcs).toBe(0); // Nothing painted before the first tick.
    clock.tick();
    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    expect(painted.arcs % CELLS).toBe(0); // Every paint covers the whole field.

    /* The first ticked frame is the frame itself, not a migration toward it.
       Migrating in from zero would open the field on full ink under the light
       skin — the solid disc the blank-until-given guard exists to prevent. */
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
    expect(painted.radii.slice(0, CELLS).every((r) => r === (SIZE / GRID) * 0.62)).toBe(true);
  });

  it("paints an onTick field under reduced motion, without running a loop", () => {
    reducedMotion(true);
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(1);

    mount(<GlyphCell grid={GRID} size={SIZE} frame={null} label="ticking" onTick={() => lit} />);

    // Read once and settled: the value is there, the movement is not.
    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    expect(clock.pending).toBe(0);
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
  });

  it("paints nothing until it has been handed something", () => {
    reducedMotion(false);
    frameClock();
    const painted = recordCanvas();

    mount(<GlyphCell grid={GRID} size={SIZE} frame={null} label="empty" />);

    // A field of zeroes is not silence — on the light skin it is a solid disc.
    expect(painted.arcs).toBe(0);
    expect(painted.clears).toBe(0);
  });

  it("paints the frame it is given, settled, on first mount", () => {
    reducedMotion(false);
    const clock = frameClock();
    const painted = recordCanvas();

    mount(
      <GlyphCell grid={GRID} size={SIZE} frame={new Float32Array(CELLS).fill(1)} label="given" />,
    );

    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    // The first frame is not a transition, so nothing is left running.
    expect(clock.pending).toBe(0);
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
  });
});
