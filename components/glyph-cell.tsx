"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { createLoop, type Loop } from "@/lib/glyph/loop";
import { sweepMask } from "@/lib/glyph/entrance";
import {
  buildCells,
  cellIndex,
  liveRipples,
  recentre,
  setTargets,
  settle,
  stepCells,
  type Cell,
  type Ripple,
} from "@/lib/glyph/matrix";

/**
 * What a source has to say on one frame: a new field, rings to strike, or both.
 *
 * The rings arrive without a birth time because the cell has the only clock
 * that matters here — the one the frame loop is running on.
 */
export type Tick = {
  frame?: Float32Array | null;
  ripples?: { x: number; y: number; strength?: number }[];
};

/** How far a finger has to travel before it meant it. Screen pixels, not cells. */
const SWIPE = 40;

/** And how little it can travel and still have been a click. */
const TAP = 8;

/* How much of its cell a pixel fills, and how far its corners are turned. The
   gap is deliberate and is most of the character: at 1 the field becomes a
   solid sheet, and the language stops being a matrix at all. */
const PIXEL_FILL = 0.74;
const PIXEL_ROUNDING = 0.26;

/** What an unlit pixel is still worth. Dark, but present — an LED, not a hole. */
const PIXEL_FLOOR = 0.16;

/** How long the arrival takes. Long enough to read as an opening, not a wipe. */
const SWEEP_MS = 600;

const ARRIVAL_KEY = "glyph:arrived";

/**
 * When this field's arrival began, on the frame clock, or null if it has missed it.
 *
 * The arrival is one moment for the whole page rather than one per field: the
 * first cell to mount stamps it, and every cell mounting inside the window is
 * handed a backdated start so it joins the wavefront already in progress. A
 * page opens as one surface, not as a handful of independent animations.
 *
 * Missing it is the normal case, and the point of the gate — a session has one
 * arrival. A client navigation back to the home mounts fresh fields long after
 * the window closed, a reload finds the stamp already set, and both get nothing,
 * which is Law 4 holding.
 *
 * The stamp is a wall clock because it has to survive a navigation, and
 * `performance.now()` restarts at zero on every document. Storing that would
 * have the next page read a stamp from its own future and open dark. The frame
 * clock is still what the sweep runs on; only the decision is made on the wall.
 *
 * Storage that throws — private mode, blocked cookies — is read as "no
 * arrival". A sweep is worth less than a page that renders.
 */
function arrivalStart(): number | null {
  try {
    const stamped = sessionStorage.getItem(ARRIVAL_KEY);
    if (stamped === null) {
      sessionStorage.setItem(ARRIVAL_KEY, String(Date.now()));
      return performance.now();
    }
    const elapsed = Date.now() - Number(stamped);
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > SWEEP_MS) return null;
    return performance.now() - elapsed;
  } catch {
    return null;
  }
}

/**
 * A field of cells on a canvas, holding whatever frame it is given.
 *
 * The component owns only what a browser has to own: the canvas, the pointer,
 * the frame loop, and the skin. What the cells say is the caller's business —
 * it hands over a frame, and the field migrates to it.
 *
 * The loop is what keeps Law 4. It runs while the pointer is inside, while
 * cells are settling, while a value transition is in flight, while a ripple is
 * alive, or while a source still has something to report — and stops itself
 * the moment all five are false.
 */
export function GlyphCell({
  grid,
  size,
  shape = "square",
  frame,
  className = "",
  label,
  onTick,
  tone = "mark",
  polarity = "luminance",
  pages,
  page = 0,
  onPageChange,
  children,
}: {
  grid: number;
  size: number;
  shape?: "circle" | "square";
  frame: Float32Array | null;
  className?: string;
  label: string;
  /** Read once per frame. Returning null means nothing to report — and, with
      nothing else in flight, is what lets the loop stop. */
  onTick?: (now: number) => Tick | null;
  /** How values become ink. See `draw` — a mark and a photograph want
      opposite things from the same field. */
  tone?: "mark" | "artwork";
  /** What a value *is*. See `draw`. */
  polarity?: "luminance" | "ink";
  /** How many faces this field wears. Paging is off entirely without it. */
  pages?: number;
  page?: number;
  /** Owning the page is the caller's job; the cell only reports the turn. */
  onPageChange?: (page: number) => void;
  /** Laid over the field, so a face can carry type the dot alphabet cannot. */
  children?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellsRef = useRef<Cell[]>([]);
  const geometryRef = useRef("");
  const primedRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const loopRef = useRef<Loop | null>(null);
  const lastRef = useRef(0);
  const reducedRef = useRef(false);
  const invertRef = useRef(false);
  const toneRef = useRef(tone);
  const polarityRef = useRef(polarity);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const sweepRef = useRef<number | null>(null);

  const { resolvedTheme } = useTheme();

  /* Ink is light on a dark ground and dark on a light one, so "more ink" flips
     with the skin. Without this the field reads as a negative. */
  const invert = resolvedTheme === "light";

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    /* A field that has never been handed a frame has nothing to say, and a
       field of zeroes is not silence — on the light skin it inverts to full
       ink, a solid disc. It stays blank until it is given something. */
    if (!primedRef.current) return;

    const cellSize = size / grid;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("color") || "#f5f5f5";

    /* Two inks, because a mark and a photograph want opposite things from the
       same field. A mark is a graphic: every cell belongs to it, so unlit cells
       stay as a faint dot field and value rides an alpha ramp on top. A
       photograph is a halftone: tone is carried by the area of a solid dot and
       by nothing else. Fading the dot as well would put value into the picture
       twice and square it, and a floor under it would stop a dark cover ever
       reaching black. */
    const artwork = toneRef.current === "artwork";
    if (artwork) ctx.globalAlpha = 1;

    /* And two meanings for the number itself. A luminance says how bright the
       depicted thing is, so it has to flip with the ground: a photograph's
       highlights are ink on white paper and bare screen on a dark one. Ink says
       where the marks are, and a mark is a mark on either ground — a figure
       drawn as a luminance would come out as a hole punched in a solid field
       the moment the light skin inverted it. */
    const flip = invertRef.current && polarityRef.current === "luminance";

    /* The arrival masks ink, not value. The field is already holding its real
       frame — the sweep only says how much of it has surfaced yet — so it is
       applied after the flip, where a zero means "no mark" on either skin
       rather than "black". Reading the clock without owning it is deliberate:
       `draw` is called from effects as well as from the loop, and a sweep that
       expired while the loop was stopped must resolve to a full field here
       rather than be cancelled on a frame nobody is counting. */
    let mask: Float32Array | null = null;
    if (sweepRef.current !== null) {
      const t = (performance.now() - sweepRef.current) / SWEEP_MS;
      if (t < 1) mask = sweepMask(grid, t);
    }

    /* A pixel, not a dot. The hardware this language comes from is a grid of
       square LEDs that never touch, and the gap is what stops a bright run of
       cells collapsing into a solid blob — the thing that made the halftone
       look burnt. Size is constant and brightness carries the value, exactly
       as an LED does: an unlit one is still there, just dark. */
    const side = cellSize * PIXEL_FILL;
    const radius = side * PIXEL_ROUNDING;

    for (const cell of cellsRef.current) {
      const lit = flip ? 1 - cell.v : cell.v;
      const value = mask ? lit * mask[cellIndex(cell, grid, size)] : lit;
      /* An artwork keeps a true black — a photograph needs somewhere for its
         shadows to go. A mark keeps the whole field visible, because the unlit
         lattice is the instrument's face and not an absence. */
      const alpha = artwork ? value : PIXEL_FLOOR + value * (1 - PIXEL_FLOOR);
      if (alpha <= 0.004) continue;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(
        cell.x + cell.ox - side / 2,
        cell.y + cell.oy - side / 2,
        side,
        side,
        radius,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [grid, size]);

  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const step = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 1 / 30);
      lastRef.current = now;

      const cells = cellsRef.current;
      const ticked = onTickRef.current?.(now) ?? null;
      if (ticked?.frame) {
        // A ticked frame primes the field as surely as the `frame` prop does:
        // a source that only ticks is still a field with something to say.
        setTargets(cells, ticked.frame);
        // And the first one is not a transition either — migrating into it from
        // zero would open the field on full ink under the light skin.
        if (!primedRef.current) settle(cells);
        primedRef.current = true;
      }
      // A ring the source asked for is struck on the source's own frame, so it
      // is exactly as old as the step that is about to read it.
      if (ticked?.ripples) {
        for (const ripple of ticked.ripples) ripplesRef.current.push({ ...ripple, born: now });
      }

      /* The loop owns the sweep's life, because the loop is the only thing that
         can be kept alive by it. Retiring it here rather than in `draw` is what
         stops a field that is never handed a frame — where `draw` returns before
         it reaches the mask — from holding the page in an endless arrival. */
      if (sweepRef.current !== null && now - sweepRef.current >= SWEEP_MS) {
        sweepRef.current = null;
      }

      const pointer = pointerRef.current;
      const busy = stepCells(cells, dt, now, pointer, ripplesRef.current);
      ripplesRef.current = liveRipples(ripplesRef.current, now);

      draw();

      // An unspent sweep was not cleared above, so it is still owed frames.
      if (ticked || pointer || busy || ripplesRef.current.length > 0) return true;
      if (sweepRef.current !== null) return true;

      // Settled and untouched — stop, and leave the page still.
      recentre(cells);
      lastRef.current = 0;
      draw();
      return false;
    },
    [draw],
  );

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  /* The clock restarts with the loop, so a field that has been still for a
     minute does not open with a minute-long frame. */
  const run = useCallback(() => {
    if (lastRef.current === 0) lastRef.current = performance.now();
    loopRef.current?.run();
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = createLoop((now) => stepRef.current(now));
    loopRef.current = loop;
    /* Reduced motion does not shorten the arrival, it declines it: the field
       opens holding its values, which is what the sweep was resolving into. */
    if (!reducedRef.current) {
      sweepRef.current = arrivalStart();
      if (sweepRef.current !== null) run();
    }
    return () => {
      loop.stop();
      loopRef.current = null;
    };
  }, [run]);

  useEffect(() => {
    const geometry = `${grid}:${size}:${shape}`;
    if (geometryRef.current !== geometry) {
      geometryRef.current = geometry;
      cellsRef.current = buildCells(grid, size, shape);
      primedRef.current = false;
    }
    if (!frame) return;

    setTargets(cellsRef.current, frame);
    // The first frame a field is handed is not a transition — it is what the
    // field was always holding. Reduced motion treats every frame that way.
    if (!primedRef.current || reducedRef.current) {
      primedRef.current = true;
      settle(cellsRef.current);
      draw();
    } else {
      run();
    }
  }, [grid, size, shape, frame, draw, run]);

  /* A ticking source is its own reason to run, and a source that changes
     identity — a track starting — is the only thing that can wake a loop that
     stopped because there was nothing left to report.

     Under reduced motion it is read once and settled: the value stays true, the
     movement does not happen. Any rings it offers are dropped here rather than
     at the source, so a caller cannot emit motion by forgetting to check. */
  useEffect(() => {
    if (!onTick) return;
    if (!reducedRef.current) {
      run();
      return;
    }
    const ticked = onTick(performance.now());
    if (!ticked?.frame) return;
    setTargets(cellsRef.current, ticked.frame);
    primedRef.current = true;
    settle(cellsRef.current);
    draw();
  }, [onTick, run, draw]);

  useEffect(() => {
    invertRef.current = invert;
    draw();
  }, [invert, draw]);

  useEffect(() => {
    toneRef.current = tone;
    draw();
  }, [tone, draw]);

  useEffect(() => {
    polarityRef.current = polarity;
    draw();
  }, [polarity, draw]);

  const toLocal = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * size,
      y: ((event.clientY - rect.top) / rect.height) * size,
    };
  };

  const paged = Boolean(pages && pages > 1 && onPageChange);
  const turn = (delta: number) => {
    if (!paged) return;
    const count = pages!;
    onPageChange!((((page + delta) % count) + count) % count);
  };

  return (
    <div
      /* A field with faces is a thing you operate, not a picture: `img` would
         make its own children presentational, and the type laid over the dots
         is where a screen reader gets the values the canvas cannot give it. */
      role={paged ? "group" : "img"}
      aria-label={label}
      title={paged ? undefined : label}
      tabIndex={paged ? 0 : undefined}
      /* The gesture is horizontal; the page still has to be able to scroll
         underneath it, or the card becomes a trap on a phone. */
      style={paged ? { touchAction: "pan-y" } : undefined}
      onKeyDown={(event) => {
        if (!paged) return;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          turn(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          turn(-1);
        }
      }}
      onPointerMove={(event) => {
        if (reducedRef.current) return;
        pointerRef.current = toLocal(event);
        run();
      }}
      onPointerLeave={() => {
        pointerRef.current = null;
        swipeRef.current = null;
        if (!reducedRef.current) run();
      }}
      onPointerDown={(event) => {
        // Recorded before the reduced-motion gate: the ring is motion and can
        // be dropped, but a page that cannot be turned is a value nobody can read.
        if (paged) swipeRef.current = { x: event.clientX, y: event.clientY };
        if (reducedRef.current) return;
        const { x, y } = toLocal(event);
        ripplesRef.current.push({ x, y, born: performance.now() });
        run();
      }}
      onPointerCancel={() => {
        swipeRef.current = null;
      }}
      onPointerUp={(event) => {
        const from = swipeRef.current;
        swipeRef.current = null;
        if (!paged || !from) return;
        const dx = event.clientX - from.x;
        const dy = event.clientY - from.y;
        // A drag that travelled sideways is a swipe; one that barely travelled
        // at all is a click, and a click goes forward. Everything else — a
        // vertical drag, which is the page scrolling — is not ours to read.
        if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
        else if (Math.abs(dx) < TAP && Math.abs(dy) < TAP) turn(1);
      }}
      className={`relative ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-hidden
        className="h-auto w-full"
      />
      {children ? <div className="pointer-events-none absolute inset-0">{children}</div> : null}
    </div>
  );
}
