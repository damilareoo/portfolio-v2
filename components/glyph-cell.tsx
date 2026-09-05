"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { createLoop, type Loop } from "@/lib/glyph/loop";
import { sweepMask } from "@/lib/glyph/entrance";
import { PIXEL_FLOOR, pixelGeometry } from "@/lib/glyph/pixel";
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
 * How dark an unlit dot is on the skin currently in force.
 *
 * Read out of CSS rather than held as a constant for exactly the reason the ink
 * is: it differs per skin, and the skin is a class on the document, not a prop.
 * Two floors, not one — see the docblock on `PIXEL_FLOOR` for why the single
 * floor's reasoning was right and still needed two numbers to hold.
 *
 * A stylesheet that has not loaded — jsdom, chiefly — hands back an empty
 * string, which parses to NaN and gets the constant. A field that paints on the
 * wrong floor is worth more than a field that does not paint.
 *
 * The clamp is hardening rather than a fix for anything reachable: only an edit
 * to the stylesheet could declare a floor above 1. It is here because the
 * failure would be silent and strange. Canvas does not clamp an out-of-range
 * `globalAlpha`, it *ignores* the assignment — so a floor of 5 would leave
 * every dot painting at whatever alpha the previous cell happened to set, and
 * the field would come out as garbage with nothing thrown.
 */
function skinFloor(style: CSSStyleDeclaration): number {
  const declared = Number.parseFloat(style.getPropertyValue("--pixel-floor"));
  if (!Number.isFinite(declared)) return PIXEL_FLOOR;
  return Math.min(Math.max(declared, 0), 1);
}

/**
 * Three bytes a cell into the strings canvas will take, once.
 *
 * `fillStyle` is a string, so a per-cell colour is a per-cell string. Built here
 * when the tint arrives rather than in `draw`, where a 64-cell field running at
 * 60fps would allocate a quarter of a million of them a second to say the same
 * four thousand things.
 */
function toInk(tint: Uint8ClampedArray): string[] {
  const ink = new Array<string>(tint.length / 3);
  for (let i = 0; i < ink.length; i++) {
    const at = i * 3;
    ink[i] = `rgb(${tint[at]} ${tint[at + 1]} ${tint[at + 2]})`;
  }
  return ink;
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
  pixel = "square",
  unlit,
  migrate,
  tint,
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
  /** The shape of a cell.

      At the present `PIXEL_ROUNDING` these two draw the identical circle: the
      round path arcs at `side / 2` and the square path round-rects at a corner
      radius of `side / 2`, which on a square is the same circle. So this prop
      is, today, a no-op — and the branch in `draw` is kept anyway, because it
      is degenerate only at that one constant. Move the rounding off a half and
      the square path is a rounded square again with nothing to re-add. Deleting
      the branch would trade a live choice for two lines. */
  pixel?: "square" | "round";
  /** What an unlit cell is still worth, when the caller wants to say. Left
      unsaid it is the skin's own floor, which keeps the whole lattice faintly
      visible — right for a panel pretending to be hardware and wrong for a card
      that should read as marks on a clean surface, which is what `unlit={0}`
      is for. A number given here is meant, so it wins over the skin. */
  unlit?: number;
  /** How fast a cell travels to the value it has been handed, per second.

      Left unsaid it is the engine's own rate, which is a cross-fade — right for
      a disc dissolving between the Spotify mark and a sleeve, and wrong for a
      field being handed a run of frames. A walker crossing a cell every hundred
      milliseconds is drawn through five cells of its own afterimage at that
      rate; a caller animating a sequence says so here and gets a cut instead of
      a dissolve. See `VALUE_RATE` in lib/glyph/matrix.ts. */
  migrate?: number;
  /** One colour per cell — three bytes each, row-major, the same order `frame`
      is in — or nothing, which is the usual case and means the field draws in
      its own ink.

      This is what lets a field hold something that belongs to somebody else.
      An album cover is the only caller today, and the reasoning is the hero's:
      a mark or a sleeve reproduced in the site's ink is a quotation the site
      has recoloured to suit itself. `frame` still says how present each cell
      is; `tint` says what a present cell is filled with.

      It must arrive in the same commit as the frame it belongs to. See the
      effect that reads it.

      The array is not copied. A caller that mutates one it has already handed
      over will find the field drawing the mutation on its next frame, which is
      the same contract `frame` has. */
  tint?: Uint8ClampedArray | null;
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
  const pixelRef = useRef(pixel);
  const unlitRef = useRef(unlit);
  const migrateRef = useRef(migrate);
  /* The tint, already turned into the strings canvas wants. Built once when the
     tint arrives rather than per cell per frame: a field of this size would
     otherwise allocate several hundred thousand short-lived strings a second to
     say the same four thousand things. */
  const inkRef = useRef<string[] | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const sweepRef = useRef<number | null>(null);

  const { resolvedTheme } = useTheme();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    /* A field that has never been handed a frame has nothing to say, and a
       field of zeroes is not the same statement as an empty one. It stays blank
       until it is given something. */
    if (!primedRef.current) return;

    const cellSize = size / grid;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    /* Both of the skin's numbers come off the canvas in one read: the ink it is
       drawn in, and how dark a dot it has not lit still is. One call, so they
       can never disagree about which skin is in force. Doing it here, in
       `draw`, is what puts them on the right side of the deferred repaint
       below — a computed style read during the effect flush would answer with
       the outgoing skin for both.

       The two fallbacks name the same skin, and that took a correction. This
       one was `#f5f5f5`, which is `--text-1` under `.dark`, while `PIXEL_FLOOR`
       falls back to the *light* floor on the grounds that a document with no
       stylesheet has no `.dark` on it either. Both cannot be right. Neither
       branch is reachable in a browser or in jsdom — a resolved `color` always
       comes back — but a pair of fallbacks that quietly disagree is worse than
       either value, so they now tell one story. */
    const skin = getComputedStyle(canvas);
    ctx.fillStyle = skin.getPropertyValue("color") || "#0f0f0f";

    const round = pixelRef.current === "round";
    const floor = unlitRef.current ?? skinFloor(skin);

    /* What a lit cell is filled with, and the only thing that differs between a
       field drawing itself and a field holding somebody else's picture.

       There used to be a second axis here — a `polarity`, which said whether a
       value meant "how bright the depicted thing is" or "where the marks are",
       because a photograph read as brightness has to invert with the ground and
       a figure must not. Every field on the site said "ink". The one that said
       "luminance" was the album disc, and it does not read a brightness any
       more: the cover arrives as colour and its own values are what a cell is
       filled with, on either skin, with nothing to flip. A distinction with one
       side left is not a distinction, so it went with the dither. */
    const ink = inkRef.current;

    /* The arrival masks ink, not value. The field is already holding its real
       frame — the sweep only says how much of it has surfaced yet. Reading the
       clock without owning it is deliberate:
       `draw` is called from effects as well as from the loop, and a sweep that
       expired while the loop was stopped must resolve to a full field here
       rather than be cancelled on a frame nobody is counting. */
    let mask: Float32Array | null = null;
    if (sweepRef.current !== null) {
      const t = (performance.now() - sweepRef.current) / SWEEP_MS;
      if (t < 1) mask = sweepMask(grid, t);
    }

    /* A cell never changes size; brightness carries the value, as a lamp does.
       The gap between cells is deliberate and is most of the character — at
       full fill the field becomes a sheet and stops being a matrix at all. */
    const { side, radius } = pixelGeometry(cellSize);

    for (const cell of cellsRef.current) {
      const at = mask || ink ? cellIndex(cell, grid, size) : 0;
      const value = mask ? cell.v * mask[at] : cell.v;
      const alpha = floor + value * (1 - floor);
      if (alpha <= 0.004) continue;
      ctx.globalAlpha = alpha;
      /* One state change per cell, and only where there is a picture to pay it
         for. A tinted field cannot batch: every cell is its own colour, which
         is what having the artwork's colour means. */
      if (ink) ctx.fillStyle = ink[at];
      ctx.beginPath();
      if (round) {
        ctx.arc(cell.x + cell.ox, cell.y + cell.oy, side / 2, 0, Math.PI * 2);
      } else {
        ctx.roundRect(
          cell.x + cell.ox - side / 2,
          cell.y + cell.oy - side / 2,
          side,
          side,
          radius,
        );
      }
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
      const busy = stepCells(cells, dt, now, pointer, ripplesRef.current, migrateRef.current);
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

  /* The repaint waits a frame, and that is the whole fix — not a nicety.

     `resolvedTheme` reaches this component one commit before the skin reaches
     the document: next-themes writes the class on `<html>` from a
     `ThemeProvider` effect, and React flushes effects child-first, so this
     effect runs while `<html>` still carries the *outgoing* class. `draw` picks
     both of its skin numbers — the ink and the unlit floor — out of
     `getComputedStyle(canvas)`, so painting here would stamp the old skin's ink
     into the bitmap, and a bitmap is not re-derived from CSS, so nothing would
     ever correct it. Measured: the paint landed 0.2-0.6 ms before the class,
     with zero frames between, and the dots then held 1.04 : 1 against their own
     card for as long as the field stayed still.

     A frame callback cannot run inside the task that flushed these effects, so
     it is strictly ordered after the provider's class write and reads the
     skin that actually arrived. Do not "simplify" this back into a synchronous
     `draw()`.

     Cancelling on cleanup matters too: a rapid double-toggle would otherwise
     leave an orphaned frame to paint after the field had moved on.

     What this costs, honestly: on the system-preference path next-themes calls
     `applyTheme` synchronously inside its own `matchMedia` listener, so the
     class — and every CSS-driven surface with it — used to flip in the same
     commit as the repaint. That repaint is now always a frame behind, so a
     visitor who changes their system skin can catch up to ~16 ms of the old
     ink sitting on the new ground. That is the trade: one frame of stale ink
     on the path that was already correct, in exchange for the explicit toggle
     not freezing the wrong ink in place for good. */
  useEffect(() => {
    const booked = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(booked);
  }, [resolvedTheme, draw]);

  /* Kept apart from the pair below on purpose. This one changes how fast the
     field travels rather than what it looks like when it arrives, so it has
     nothing to repaint — and folding it in would put a prop with no bearing on
     the picture inside two effects whose synchronous draws the first paint
     depends on. */
  useEffect(() => {
    migrateRef.current = migrate;
  }, [migrate]);

  /* These two draw synchronously, and that is load-bearing beyond their own
     props. They are flushed after the skin effect above, which only books its
     repaint rather than performing it — so on the very first commit these are
     what paint the field at all. Drop the `draw()` from either as a "these are
     only refs, nothing to repaint" tidy-up and mount paints nothing until a
     frame callback comes round, which the eye reads as the field arriving late
     and the loop, if there is nothing else in flight, never wakes to fix. */
  useEffect(() => {
    pixelRef.current = pixel;
    unlitRef.current = unlit;
    draw();
  }, [pixel, unlit, draw]);

  /* The tint, turned into canvas's own colour strings once and kept.

     It has to arrive in the same commit as the frame it belongs to, and that is
     a real constraint rather than a preference. This effect is flushed after the
     one that takes the frame, so two setters batched into one commit leave the
     frame drawn once against the *previous* tint before this redraws it
     correctly. That is harmless only because both of those draws are
     synchronous inside the same commit and the browser never gets a paint
     between them. It stops being harmless the moment either is deferred, and
     the failure would be one frame of an album cover wearing the last one's
     colours. A caller that sets one without the other is asking for exactly
     that.

     `null` is the common case: a field with no tint draws in its own ink. */
  useEffect(() => {
    inkRef.current = tint ? toInk(tint) : null;
    draw();
  }, [tint, draw]);

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
