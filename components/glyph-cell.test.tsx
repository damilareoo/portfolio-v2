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
 * what it was asked to draw, not just how often: under the `mark` ink, `draw`
 * encodes a cell's value as `0.2 + value * 0.8` alpha and a radius of
 * `value * cellSize * 0.62`, so reading those back says which frame the field
 * actually painted — the one it was handed, or some half-migrated state on the
 * way to it. The centres come back too, which is how a ring passing through the
 * field can be seen at all.
 */
function recordCanvas() {
  const painted = {
    arcs: 0,
    clears: 0,
    alphas: [] as number[],
    radii: [] as number[],
    xs: [] as number[],
  };
  const ctx = {
    setTransform: () => {},
    clearRect: () => {
      painted.clears++;
    },
    beginPath: () => {},
    arc: (x: number, _y: number, r: number) => {
      painted.arcs++;
      painted.radii.push(r);
      painted.xs.push(x);
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

    mount(<GlyphCell grid={GRID} size={SIZE} frame={null} label="ticking" onTick={() => ({ frame: lit })} />);

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

    mount(<GlyphCell grid={GRID} size={SIZE} frame={null} label="ticking" onTick={() => ({ frame: lit })} />);

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

  it("inks artwork by area, and lets a dark cell be dark", () => {
    reducedMotion(false);
    frameClock();
    const painted = recordCanvas();
    const frame = new Float32Array(CELLS); // Everything black but two cells.
    frame[0] = 1;
    frame[1] = 0.25;

    mount(
      <GlyphCell grid={GRID} size={SIZE} frame={frame} label="cover" tone="artwork" />,
    );

    const cell = SIZE / GRID;
    // A quarter of the luminance lays down a quarter of the ink, which is half
    // the radius — the whole point of the square root.
    expect(painted.radii.slice(0, 2)).toEqual([cell * 0.5, cell * 0.25]);
    // No alpha ramp: the dot is solid and its area carries the tone alone.
    expect(painted.alphas.slice(0, 2)).toEqual([1, 1]);
    // And the other 62 cells drew nothing at all, rather than a floor of ink.
    expect(painted.arcs % 2).toBe(0);
    expect(painted.arcs).toBeLessThan(CELLS);
  });

  it("strikes the rings a ticking source asks for", () => {
    reducedMotion(false);
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(0.5);
    let struck = false;

    mount(
      <GlyphCell
        grid={GRID}
        size={SIZE}
        frame={null}
        label="ticking"
        onTick={() => {
          if (struck) return null; // Nothing more to report; the ring carries on.
          struck = true;
          return { frame: lit, ripples: [{ x: SIZE / 2, y: SIZE / 2 }] };
        }}
      />,
    );

    const start = performance.now();
    clock.tick(start);
    const home = painted.xs.slice(0, CELLS);

    // Long enough for the front to have travelled out to the corners.
    for (let i = 1; i <= 12; i++) clock.tick(start + i * 16);

    const moved = painted.xs.slice(-CELLS);
    // The threshold is small because the strike is: TUNING's damping is near
    // critical, so a ring is a shimmer through the field, not a wave over it.
    expect(moved.some((x, i) => Math.abs(x - home[i]) > 0.05)).toBe(true);
    // A live ring is its own reason to keep running, with nothing left to report.
    expect(clock.pending).toBe(1);
  });

  it("emits no ring at all under reduced motion", () => {
    reducedMotion(true);
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(0.5);

    mount(
      <GlyphCell
        grid={GRID}
        size={SIZE}
        frame={null}
        label="ticking"
        onTick={() => ({ frame: lit, ripples: [{ x: SIZE / 2, y: SIZE / 2 }] })}
      />,
    );

    // The frame is honoured; the ring the same tick asked for is not, and no
    // loop is left running to carry one.
    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    expect(clock.pending).toBe(0);
  });
});
