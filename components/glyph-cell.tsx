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

/**
 * A field of cells on a canvas, holding whatever frame it is given.
 *
 * The component owns only what a browser has to own: the canvas, the pointer,
 * the frame loop, and the skin. What the cells say is the caller's business —
 * it hands over a frame, and the field migrates to it.
 *
 * The loop is what keeps Law 4. It runs while the pointer is inside, while
 * cells are settling, while a value transition is in flight, or while a ripple
 * is alive — and stops itself the moment all four are false.
 */
export function GlyphCell({
  grid,
  size,
  shape = "square",
  frame,
  className = "",
  label,
  onTick,
}: {
  grid: number;
  size: number;
  shape?: "circle" | "square";
  frame: Float32Array | null;
  className?: string;
  label: string;
  /** A frame source read once per frame. Returning null means nothing new. */
  onTick?: (now: number) => Float32Array | null;
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

    for (const cell of cellsRef.current) {
      const value = invertRef.current ? 1 - cell.v : cell.v;
      const r = Math.max(0.45, value * cellSize * 0.62);
      ctx.globalAlpha = 0.2 + value * 0.8;
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
      if (ticked) setTargets(cells, ticked);

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

  /* A ticking source is its own reason to run. Under reduced motion it is read
     once and settled: the value stays true, the movement does not happen. */
  useEffect(() => {
    if (!onTick) return;
    if (!reducedRef.current) {
      run();
      return;
    }
    const ticked = onTick(performance.now());
    if (!ticked) return;
    setTargets(cellsRef.current, ticked);
    settle(cellsRef.current);
    draw();
  }, [onTick, run, draw]);

  useEffect(() => {
    invertRef.current = invert;
    draw();
  }, [invert, draw]);

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
