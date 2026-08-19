"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createLoop, type Loop } from "@/lib/glyph/loop";
import {
  buildCells,
  liveRipples,
  recentre,
  setTargets,
  settle,
  stepCells,
  type Cell,
  type Ripple,
} from "@/lib/glyph/matrix";
import { inkRadius } from "@/lib/glyph/tone";

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
       twice and square it — the very crush `inkRadius` exists to undo — and a
       floor under it would stop a dark cover ever reaching black. */
    const artwork = toneRef.current === "artwork";
    if (artwork) ctx.globalAlpha = 1;

    for (const cell of cellsRef.current) {
      const value = invertRef.current ? 1 - cell.v : cell.v;
      const r = artwork ? inkRadius(value, cellSize) : Math.max(0.45, value * cellSize * 0.62);
      if (r <= 0) continue; // Real blacks: an unlit cell draws nothing at all.
      if (!artwork) ctx.globalAlpha = 0.2 + value * 0.8;
      ctx.beginPath();
      ctx.arc(cell.x + cell.ox, cell.y + cell.oy, r, 0, Math.PI * 2);
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

      const pointer = pointerRef.current;
      const busy = stepCells(cells, dt, now, pointer, ripplesRef.current);
      ripplesRef.current = liveRipples(ripplesRef.current, now);

      draw();

      if (ticked || pointer || busy || ripplesRef.current.length > 0) return true;

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
    return () => {
      loop.stop();
      loopRef.current = null;
    };
  }, []);

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

  const toLocal = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * size,
      y: ((event.clientY - rect.top) / rect.height) * size,
    };
  };

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      onPointerMove={(event) => {
        if (reducedRef.current) return;
        pointerRef.current = toLocal(event);
        run();
      }}
      onPointerLeave={() => {
        pointerRef.current = null;
        if (!reducedRef.current) run();
      }}
      onPointerDown={(event) => {
        if (reducedRef.current) return;
        const { x, y } = toLocal(event);
        ripplesRef.current.push({ x, y, born: performance.now() });
        run();
      }}
      className={className}
    >
      <canvas ref={canvasRef} width={size} height={size} className="h-auto w-full" />
    </div>
  );
}
