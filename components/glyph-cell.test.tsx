// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider, useTheme } from "next-themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlyphCell } from "@/components/glyph-cell";
import { PIXEL_FLOOR, pixelGeometry } from "@/lib/glyph/pixel";

// React has to be told it is inside a test, or every render warns about act().
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GRID = 8;
const SIZE = 80;
const CELLS = GRID * GRID; // A square field draws one arc per cell.

/**
 * jsdom has no 2D context, so the canvas is answered by a recorder. It keeps
 * what it was asked to draw, not just how often: under the `mark` ink, `draw`
 * encodes a cell's value as `floor + value * (1 - floor)` alpha, so reading the
 * alphas back says which frame the field actually painted — the one it was
 * handed, or some half-migrated state on the way to it. The radii say a pixel
 * is the shape and size it should be, and the centres come back too, which is
 * how a ring passing through the field can be seen at all.
 */
function recordCanvas() {
  const painted = {
    arcs: 0,
    clears: 0,
    alphas: [] as number[],
    radii: [] as number[],
    xs: [] as number[],
    inks: [] as string[],
  };
  const ctx = {
    setTransform: () => {},
    clearRect: () => {
      painted.clears++;
    },
    beginPath: () => {},
    /* The field's square path is what jsdom sees, and at the present rounding it
       round-rects a circle rather than a square — the radius is half the side.
       The centre is recovered from the corner so a ring travelling across the
       field can still be seen by where it struck. */
    roundRect: (x: number, _y: number, w: number, _h: number, r: number) => {
      painted.arcs++;
      painted.radii.push(r);
      painted.xs.push(x + w / 2);
      painted.alphas.push(ctx.globalAlpha);
      painted.inks.push(ctx.fillStyle);
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
   given can be read straight back off what it painted. jsdom serves no
   stylesheet, so `--pixel-floor` is missing and the field falls back to the
   constant — which is the fallback these tests are reading through. */
const FLOOR = PIXEL_FLOOR;
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

/**
 * The one frame a mount books that is not the loop.
 *
 * The skin repaint is deliberately deferred past the effect flush — next-themes
 * writes the theme class from its own `ThemeProvider` effect, and React flushes
 * effects child-first, so a synchronous repaint there reads the outgoing skin's
 * ink. So every mount leaves exactly one frame booked, whether or not anything
 * is moving. Tests asking whether the *loop* is running count from here.
 */
const SKIN_REPAINT = 1;

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
    expect(clock.pending).toBe(SKIN_REPAINT + 1);
    expect(painted.arcs).toBe(0); // Nothing painted before the first tick.
    clock.tick();
    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    expect(painted.arcs % CELLS).toBe(0); // Every paint covers the whole field.

    /* The first ticked frame is the frame itself, not a migration toward it.
       Migrating in from zero would open the field on full ink under the light
       skin — the solid disc the blank-until-given guard exists to prevent. */
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
    // Every pixel is the same size — an LED does not grow, it brightens.
    const corner = pixelGeometry(SIZE / GRID).radius;
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
    expect(clock.pending).toBe(SKIN_REPAINT); // No loop — only the skin's one-shot.
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
    expect(clock.pending).toBe(SKIN_REPAINT);
    for (const value of firstFrameValues(painted)) expect(value).toBeCloseTo(1, 6);
  });

  it("lets a dark cell be dark when the lattice is turned off", () => {
    reducedMotion(false);
    frameClock();
    const painted = recordCanvas();
    const frame = new Float32Array(CELLS); // Everything black but two cells.
    frame[0] = 1;
    frame[1] = 0.25;

    mount(
      <GlyphCell grid={GRID} size={SIZE} frame={frame} label="cover" unlit={0} />,
    );

    /* With no floor under it the value is the brightness outright, and an unlit
       cell paints nothing at all rather than a lattice — which is what a card
       wants, and what a photograph wants for its shadows. */
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

  /* A field holds somebody else's picture by being handed its colours, and a
     colour the site did not choose must survive the skin unchanged. What this
     replaces is the `polarity` test: the field used to read a value two ways —
     as a brightness, which inverted on the light skin, or as ink, which did
     not — because the album disc handed it a photograph's luminance. It hands
     over the cover's own colours now, so nothing left on the site reads a value
     as a brightness, and the axis went with the dither. */
  it("fills a tinted cell with the colour it was given, on either skin", () => {
    const lit = new Float32Array(CELLS).fill(1);
    const tint = new Uint8ClampedArray(CELLS * 3);
    for (let i = 0; i < CELLS; i++) {
      tint[i * 3] = 200;
      tint[i * 3 + 1] = 40;
      tint[i * 3 + 2] = 10;
    }

    const paint = (theme: "light" | "dark") => {
      reducedMotion(false);
      frameClock();
      const painted = recordCanvas();
      mount(
        <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
          <GlyphCell grid={GRID} size={SIZE} frame={lit} tint={tint} label="cover" />
        </ThemeProvider>,
      );
      /* The last paint, not the first. The skin effect books a frame rather
         than painting, and this test never turns the clock — so what lands last
         is the trailing `[tint, draw]` effect. That ordering is the coupling
         noted at those effects in `glyph-cell.tsx`, and this is what would
         catch it being broken. */
      const inks = painted.inks.slice(-CELLS);
      act(() => root?.unmount());
      vi.restoreAllMocks();
      return inks;
    };

    for (const theme of ["light", "dark"] as const) {
      for (const ink of paint(theme)) expect(ink).toBe("rgb(200 40 10)");
    }
  });

  it("goes back to its own ink when the tint is taken away", () => {
    /* The half a "does it tint" test cannot reach: every field on the site
       draws untinted, so an assertion that a tint arrives passes just as well
       against a component that never lets go of one. A disc that kept the last
       cover's colours under the Spotify mark is the failure. */
    reducedMotion(false);
    frameClock();
    const lit = new Float32Array(CELLS).fill(1);
    const tint = new Uint8ClampedArray(CELLS * 3).fill(90);
    const painted = recordCanvas();

    mount(<GlyphCell grid={GRID} size={SIZE} frame={lit} tint={tint} label="cover" />);
    expect(painted.inks.at(-1)).toBe("rgb(90 90 90)");

    act(() => root?.render(<GlyphCell grid={GRID} size={SIZE} frame={lit} label="mark" />));
    // Whatever jsdom resolves `color` to, it is not the tint that was dropped.
    expect(painted.inks.at(-1)).not.toBe("rgb(90 90 90)");
  });

  it("repaints on the next frame, not inside the effect", () => {
    // next-themes writes the <html> class in its own effect, and React flushes
    // effects child-first — so painting synchronously here reads the OUTGOING
    // skin's ink and freezes it into the bitmap for good. Measured at 1.04:1
    // contrast: white dots on a white card.
    reducedMotion(false);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const painted = recordCanvas();

    mount(<GlyphCell grid={5} size={50} frame={new Float32Array(25).fill(1)} label="A" />);

    expect(frames.length).toBeGreaterThan(0);

    /* And the booked frame is the repaint itself, not some other errand:
       running it covers the field again, this time under the skin that has
       finally landed. */
    const before = painted.arcs;
    act(() => {
      for (const paintFrame of frames.splice(0)) paintFrame(performance.now());
    });
    expect(painted.arcs).toBeGreaterThan(before);
  });

  it("cancels the frame it booked when the skin turns again before it runs", () => {
    /* Two toggles inside one frame is an ordinary thing to do to a switch, and
       without the cleanup each one leaves its own repaint booked. They would
       all run on the next frame, painting the same field two and three times
       over — and worse, a frame booked against a skin the field has already
       left is a paint nobody asked for. */
    reducedMotion(false);
    const clock = frameClock();
    recordCanvas();
    const skin: { set?: (theme: string) => void } = {};

    function Switch() {
      skin.set = useTheme().setTheme;
      return null;
    }

    mount(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Switch />
        <GlyphCell grid={GRID} size={SIZE} frame={new Float32Array(CELLS).fill(1)} label="toggling" />
      </ThemeProvider>,
    );
    expect(clock.pending).toBe(SKIN_REPAINT);

    // Both turns land before the clock is ever advanced.
    act(() => skin.set!("dark"));
    act(() => skin.set!("light"));

    // Still one: each re-run cancelled the frame the run before it booked.
    expect(clock.pending).toBe(SKIN_REPAINT);
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
    expect(clock.pending).toBe(SKIN_REPAINT);
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
    expect(clock.pending).toBe(SKIN_REPAINT + 1); // Arriving is its own reason to run.

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
    expect(clock.pending).toBe(SKIN_REPAINT);
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

describe("the floor an unlit dot sits on", () => {
  /**
   * A stylesheet, as far as `draw` is concerned.
   *
   * jsdom serves none, so `--pixel-floor` is empty in every other test here and
   * the field falls back to `PIXEL_FLOOR`. These three are the ones that care
   * which of the two numbers reached the canvas, so they answer the read.
   */
  function skinDeclares(floor: string) {
    const real = window.getComputedStyle.bind(window);
    vi.stubGlobal("getComputedStyle", (element: Element) => {
      const style = real(element);
      return {
        getPropertyValue: (name: string) =>
          name === "--pixel-floor" ? floor : style.getPropertyValue(name),
      } as CSSStyleDeclaration;
    });
  }

  /** One lit cell and sixty-three unlit ones, painted once and settled. */
  function paintOne(element: React.ReactElement) {
    reducedMotion(false);
    frameClock();
    const painted = recordCanvas();
    mount(element);
    return painted;
  }

  const frame = () => {
    const values = new Float32Array(CELLS);
    values[0] = 1;
    return values;
  };

  it("takes the floor from the skin, not from a constant", () => {
    skinDeclares("0.05");
    const painted = paintOne(
      <GlyphCell grid={GRID} size={SIZE} frame={frame()} label="dark skin" />,
    );

    // The dark skin's floor, which is not the fallback — so it was read.
    expect(painted.alphas[0]).toBeCloseTo(1, 6);
    expect(painted.alphas[1]).toBeCloseTo(0.05, 6);
    expect(0.05).not.toBe(PIXEL_FLOOR);
  });

  it("falls back to the constant when no stylesheet declares one", () => {
    skinDeclares("");
    const painted = paintOne(
      <GlyphCell grid={GRID} size={SIZE} frame={frame()} label="no sheet" />,
    );

    // A field that paints on the fallback floor beats a field that does not paint.
    expect(painted.alphas[1]).toBeCloseTo(PIXEL_FLOOR, 6);
  });

  it("clamps a floor no stylesheet should have declared", () => {
    skinDeclares("5");
    const painted = paintOne(
      <GlyphCell grid={GRID} size={SIZE} frame={frame()} label="broken sheet" />,
    );

    /* Hardening, not a live defect — only an edit to globals.css could get
       here. It is worth a test because the failure is silent: a real canvas
       *ignores* an out-of-range `globalAlpha` rather than clamping it, so an
       unclamped 5 would leave every dot painting at whatever alpha the previous
       one left behind, and the whole field would come out wrong with nothing
       thrown. Clamped to 1, every cell is full ink — wrong-looking, but
       legible, and traceable to the stylesheet that said so. */
    expect(painted.arcs).toBeGreaterThanOrEqual(CELLS);
    expect(painted.alphas.every((alpha) => alpha === 1)).toBe(true);
  });

  it("lets a caller who named a zero keep it, whatever the skin says", () => {
    skinDeclares("0.05");
    const painted = paintOne(
      <GlyphCell grid={GRID} size={SIZE} frame={frame()} unlit={0} label="card" />,
    );

    /* `unlit={0}` is the widget cards saying a cell that is off is simply not
       there. The skin must not put a lattice back under them, and zero is the
       value a `||` here would have thrown away — hence `??` in the component. */
    expect(painted.arcs).toBeGreaterThanOrEqual(1);
    // One pixel per paint, however many times it repaints: the other 63 cells
    // are unlit, and an unlit cell under a caller's own zero draws nothing.
    expect(painted.alphas.every((alpha) => alpha === 1)).toBe(true);
  });

  it("lets a caller who named any other floor keep that too", () => {
    skinDeclares("0.05");
    const painted = paintOne(
      <GlyphCell grid={GRID} size={SIZE} frame={frame()} unlit={0.3} label="lit card" />,
    );

    /* Zero is the interesting falsy case and it is not the only case. A caller
       who asks for a heavier lattice than the skin's must get it, or the prop
       only half exists. */
    expect(painted.alphas[0]).toBeCloseTo(1, 6);
    expect(painted.alphas[1]).toBeCloseTo(0.3, 6);
  });
});
