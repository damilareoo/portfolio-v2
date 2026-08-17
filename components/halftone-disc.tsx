"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

type NowPlaying = {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  songUrl?: string;
  artUrl?: string;
  progressMs?: number;
  durationMs?: number;
};

const SIZE = 128; // css px
const GRID = 24; // dots across the disc
const CELL = SIZE / GRID;
const RADIUS = SIZE / 2;

/* The tile feel spec, applied to a particle: stiffness 400, damping 32.
   Ratio 0.8 — underdamped enough to feel physical, settled in ~250ms. */
const STIFFNESS = 400;
const DAMPING = 32;
const PUSH_RADIUS = 46;
const PUSH_STRENGTH = 26;

type Dot = { x: number; y: number; ox: number; oy: number; vx: number; vy: number; v: number };

/** Cells inside the circle, each carrying a luminance that the artwork fills in. */
function buildDots(): Dot[] {
  const dots: Dot[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = (col + 0.5) * CELL;
      const y = (row + 0.5) * CELL;
      const dx = x - RADIUS;
      const dy = y - RADIUS;
      if (Math.sqrt(dx * dx + dy * dy) > RADIUS - CELL * 0.35) continue;
      dots.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0, v: 0.42 });
    }
  }
  return dots;
}

/**
 * No artwork is not an error state — the disc flattens to an even grid.
 * Exactly 0.5 so the light/dark inversion leaves the resting disc identical in
 * both skins: silence should not look like a different object.
 */
const SILENT_VALUE = 0.5;

function flatten(dots: Dot[]) {
  for (const dot of dots) dot.v = SILENT_VALUE;
}

/** Rec. 601 luma — the standard weighting for perceived brightness. */
function sample(dots: Dot[], pixels: Uint8ClampedArray) {
  for (const dot of dots) {
    const col = Math.min(GRID - 1, Math.floor(dot.x / CELL));
    const row = Math.min(GRID - 1, Math.floor(dot.y / CELL));
    const i = (row * GRID + col) * 4;
    dot.v = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
  }
}

function clock(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Now-playing as an ordered-dither disc.
 *
 * Dithering is what lets real album artwork onto a site with no accent hue: the
 * colour is not suppressed, it is discarded, and what is left is the one thing
 * the palette does trade in — value.
 *
 * The frame loop is the part that keeps Law 4. It runs only while the pointer
 * is inside the disc or dots are still settling, and stops itself the moment
 * both are false. A page at rest holds no running animation.
 */
export function HalftoneDisc({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>(buildDots());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const reducedRef = useRef(false);

  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  /* Ink is light on a dark ground and dark on a light one, so "more ink" flips
     with the skin: bright artwork grows the dots in dark mode, dark artwork
     grows them in light mode. Without this the disc reads as a negative. */
  const invert = resolvedTheme === "light";

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr;
      canvas.height = SIZE * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const ink = getComputedStyle(canvas).getPropertyValue("color") || "#f5f5f5";
    ctx.fillStyle = ink;

    for (const dot of dotsRef.current) {
      const value = invert ? 1 - dot.v : dot.v;
      // Floored so the darkest cells stay a legible grid rather than dropping
      // out — the disc has to read as an object even when it is nearly empty.
      const r = Math.max(0.5, value * CELL * 0.6);
      ctx.globalAlpha = 0.38 + value * 0.62;
      ctx.beginPath();
      ctx.arc(dot.x + dot.ox, dot.y + dot.oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [invert]);

  /* One loop, self-terminating. Anything that wants motion calls run(). */
  const run = useCallback(() => {
    if (frameRef.current !== null) return;
    lastRef.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 1 / 30);
      lastRef.current = now;

      const pointer = pointerRef.current;
      let moving = false;

      for (const dot of dotsRef.current) {
        let tx = 0;
        let ty = 0;

        if (pointer) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < PUSH_RADIUS && dist > 0.001) {
            const falloff = 1 - dist / PUSH_RADIUS;
            const push = falloff * falloff * PUSH_STRENGTH;
            tx = (dx / dist) * push;
            ty = (dy / dist) * push;
          }
        }

        // Spring toward the target offset, which is zero once the pointer leaves.
        const ax = STIFFNESS * (tx - dot.ox) - DAMPING * dot.vx;
        const ay = STIFFNESS * (ty - dot.oy) - DAMPING * dot.vy;
        dot.vx += ax * dt;
        dot.vy += ay * dt;
        dot.ox += dot.vx * dt;
        dot.oy += dot.vy * dt;

        if (Math.abs(dot.vx) + Math.abs(dot.vy) + Math.abs(dot.ox) + Math.abs(dot.oy) > 0.05) {
          moving = true;
        }
      }

      draw();

      if (pointer || moving) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        // Settled and untouched — stop, and leave the page still.
        frameRef.current = null;
        for (const dot of dotsRef.current) {
          dot.ox = dot.oy = dot.vx = dot.vy = 0;
        }
        draw();
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [draw]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    draw();
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw, resolvedTheme]);

  /* Poll on the same 30s cadence as the counters. Nothing playing is a normal
     answer, not an error — the dots simply flatten into an even grid. */
  useEffect(() => {
    let cancelled = false;

    const read = () =>
      fetch("/api/now-playing")
        .then((r) => r.json())
        .then((d: NowPlaying) => {
          if (!cancelled) setTrack(d);
        })
        .catch(() => {
          if (!cancelled) setTrack({ isPlaying: false });
        });

    read();
    const id = setInterval(read, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* Artwork -> luminance per cell. Same-origin via the proxy, so reading the
     pixels back does not throw on a tainted canvas. */
  useEffect(() => {
    const art = track?.isPlaying ? track.artUrl : undefined;

    if (!art) {
      flatten(dotsRef.current);
      draw();
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = GRID;
      off.height = GRID;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      octx.drawImage(img, 0, 0, GRID, GRID);
      let pixels: Uint8ClampedArray;
      try {
        pixels = octx.getImageData(0, 0, GRID, GRID).data;
      } catch {
        return; // tainted despite the proxy — keep the even grid
      }

      sample(dotsRef.current, pixels);
      draw();
    };

    img.src = art;
    return () => {
      cancelled = true;
    };
  }, [track?.artUrl, track?.isPlaying, draw]);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
    run();
  };

  const onPointerLeave = () => {
    pointerRef.current = null;
    setOpen(false);
    if (!reducedRef.current) run();
  };

  const playing = track?.isPlaying && track.title;
  const label = playing ? `Now playing: ${track.title} by ${track.artist}` : "Nothing playing";

  return (
    <div
      className={`pointer-events-none z-40 flex items-end justify-end lg:fixed lg:bottom-6 lg:right-6 ${className}`}
    >
      <div className="pointer-events-auto flex items-end gap-3">
        {/* The record, revealed by holding the pointer or focus on the disc. */}
        <div
          aria-hidden={!open}
          className={`hidden max-w-[15rem] rounded-[var(--radius-tile)] border border-line bg-surface px-3 py-2.5 transition-opacity duration-200 sm:block ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
            {playing ? "Now playing" : "Spotify"}
          </p>
          {playing ? (
            <>
              <p className="mt-1 truncate text-[0.75rem] font-medium">{track.title}</p>
              <p className="truncate text-[0.75rem] text-ink-2">{track.artist}</p>
              {Boolean(track.durationMs) && (
                <p className="mt-1 font-mono text-[0.5625rem] tabular-nums text-ink-3">
                  {clock(track.progressMs ?? 0)} / {clock(track.durationMs ?? 0)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[0.75rem] text-ink-2">
              {track === null ? "—" : "Nothing playing"}
            </p>
          )}
        </div>

        <a
          href={playing ? track.songUrl : "#"}
          target={playing ? "_blank" : undefined}
          rel={playing ? "noopener noreferrer" : undefined}
          aria-label={label}
          title={label}
          onPointerMove={onPointerMove}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={onPointerLeave}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={playing ? undefined : (e) => e.preventDefault()}
          className="block shrink-0 rounded-full text-ink transition-colors"
          style={{ width: SIZE, height: SIZE }}
        >
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            aria-hidden
            className="h-full w-full"
          />
        </a>
      </div>
    </div>
  );
}
