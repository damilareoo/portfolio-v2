// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    /* The field draws square pixels. The centre is recovered from the corner so
       a ring travelling across the field can still be seen by where it struck. */
    roundRect: (x: number, _y: number, w: number, _h: number, r: number) => {
      painted.arcs++;
      painted.radii.push(r);
      painted.xs.push(x + w / 2);
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

/* A lit pixel's alpha is `FLOOR + value * (1 - FLOOR)`, so the value it was
   given can be read straight back off what it painted. */
const FLOOR = 0.16;
const valueOf = (alpha: number) => (alpha - FLOOR) / (1 - FLOOR);

/** The values the first painted frame carried, recovered from its alphas. */
function firstFrameValues(painted: { alphas: number[] }) {
  return painted.alphas.slice(0, CELLS).map(valueOf);
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
    // next-themes still reaches for the deprecated pair, and the skin test
    // mounts a real provider rather than pretending to be one.
    addListener: () => {},
    removeListener: () => {},
  }));
}

/** The stamp `GlyphCell` leaves to record that this session has arrived. */
const ARRIVAL_KEY = "glyph:arrived";

/**
 * Say the session has already arrived, or that it has not.
 *
 * Every test but the arrival's own runs on a session that arrived long ago,
 * because that is the state the site spends its life in — the sweep is one
 * moment out of a whole session, so tests opt into it rather than out of it.
 */
function alreadyArrived() {
  sessionStorage.setItem(ARRIVAL_KEY, "0"); // Stamped at the epoch: long over.
}

function arriving() {
  sessionStorage.removeItem(ARRIVAL_KEY);
}

/**
 * Both clocks, moved as one — which is the only way they ever move in life.
 *
 * The sweep decides whether to play on the wall clock and then runs on the
 * frame clock, so a test that advanced one and not the other would be testing
 * a machine that does not exist.
 */
function stopwatch() {
  const wall = Date.now();
  let elapsed = 0;
  vi.spyOn(performance, "now").mockImplementation(() => 1000 + elapsed);
  vi.spyOn(Date, "now").mockImplementation(() => wall + elapsed);
  return {
    advance(ms: number) {
      elapsed += ms;
    },
  };
}

/** The values the most recent painted frame carried. */
function lastFrameValues(painted: { alphas: number[] }) {
  return painted.alphas.slice(-CELLS).map(valueOf);
}

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount(element: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(element));
}

beforeEach(alreadyArrived);

afterEach(() => {
  sessionStorage.clear();
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
    // Every pixel is the same size — an LED does not grow, it brightens.
    const corner = (SIZE / GRID) * 0.74 * 0.26;
    expect(painted.radii.slice(0, CELLS).every((r) => Math.abs(r - corner) < 1e-9)).toBe(true);
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

    /* A photograph needs somewhere for its shadows to go, so artwork keeps a
       true black: the value is the brightness, with no floor under it, and an
       unlit cell paints nothing at all rather than a lattice. */
    expect(painted.alphas.slice(0, 2)).toEqual([1, 0.25]);
    // Two pixels per paint and no more, however many times it repaints: the
    // other 62 cells are black and a black cell in a photograph draws nothing.
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

  /* The light skin turns a value into its opposite, which is right for a
     photograph and catastrophic for a drawing: a figure on an empty field would
     come out as a hole punched in a solid block of ink. The pedometer card is
     the caller that would suffer it, so the distinction is pinned here. */
  it("inverts a luminance on the light skin and leaves ink alone", () => {
    const dark = new Float32Array(CELLS); // Nothing lit: the empty field.

    const paint = (polarity: "luminance" | "ink") => {
      reducedMotion(false);
      frameClock();
      const painted = recordCanvas();
      mount(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <GlyphCell grid={GRID} size={SIZE} frame={dark} label="empty" polarity={polarity} />
        </ThemeProvider>,
      );
      // The last paint, not the first: the skin effect repaints after mount.
      const values = painted.alphas.slice(-CELLS).map(valueOf);
      act(() => root?.unmount());
      vi.restoreAllMocks();
      return values;
    };

    // A dark photograph on a light ground is ink everywhere.
    for (const value of paint("luminance")) expect(value).toBeCloseTo(1, 6);
    // An empty drawing is empty on either ground.
    for (const value of paint("ink")) expect(value).toBeCloseTo(0, 6);
  });

  it("turns its pages by keyboard, wrapping in both directions", () => {
    reducedMotion(false);
    frameClock();
    recordCanvas();
    const turns: number[] = [];

    mount(
      <GlyphCell
        grid={GRID}
        size={SIZE}
        frame={new Float32Array(CELLS).fill(1)}
        label="paged"
        pages={3}
        page={0}
        onPageChange={(next) => turns.push(next)}
      />,
    );

    const card = host!.querySelector('[role="group"]')!;
    // A field with faces is operated, not looked at — `img` would hide the type
    // laid over it from the very readers that depend on it.
    expect(card.getAttribute("tabindex")).toBe("0");

    const press = (key: string) =>
      act(() => {
        card.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });

    press("ArrowRight");
    press("ArrowLeft");
    press("ArrowUp"); // Not ours; the page still has to be able to scroll.
    expect(turns).toEqual([1, 2]);
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
  it("opens on a sweep that surfaces the centre before the corners", () => {
    arriving();
    reducedMotion(false);
    const watch = stopwatch();
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(1);

    mount(<GlyphCell grid={GRID} size={SIZE} frame={lit} label="arriving" />);

    // The field is already holding a full frame; none of it has surfaced yet.
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(0, 6);
    expect(clock.pending).toBe(1); // Arriving is its own reason to run.

    // Halfway through, the wavefront has passed the middle and not the corner.
    watch.advance(300);
    clock.tick();
    const midway = lastFrameValues(painted);
    expect(midway[4 * GRID + 4]).toBeGreaterThan(0.5);
    expect(midway[0]).toBeCloseTo(0, 6);

    // And it resolves into the frame the field was holding all along, then stops.
    watch.advance(400);
    clock.tick();
    for (const value of lastFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
    expect(clock.pending).toBe(0);
  });

  it("declines the arrival under reduced motion", () => {
    arriving();
    reducedMotion(true);
    const clock = frameClock();
    const painted = recordCanvas();
    const lit = new Float32Array(CELLS).fill(1);

    mount(<GlyphCell grid={GRID} size={SIZE} frame={lit} label="still" />);

    // Not a faster sweep — no sweep. The values are true on the first paint.
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
    expect(clock.pending).toBe(0);
  });

  it("arrives once a session, and not for a field mounted later", () => {
    arriving();
    reducedMotion(false);
    const watch = stopwatch();
    frameClock();
    const first = recordCanvas();
    const lit = new Float32Array(CELLS).fill(1);

    mount(<GlyphCell grid={GRID} size={SIZE} frame={lit} label="first" />);
    for (const value of firstFrameValues(first)) expect(value).toBeCloseTo(0, 6);

    act(() => root!.unmount());
    host!.remove();

    // A client navigation back, long after the window closed. The stamp is
    // still in storage, so this field opens holding its values.
    watch.advance(5000);
    const later = recordCanvas();
    mount(<GlyphCell grid={GRID} size={SIZE} frame={lit} label="later" />);
    for (const value of firstFrameValues(later)) expect(value).toBeCloseTo(1, 6);
  });
});
