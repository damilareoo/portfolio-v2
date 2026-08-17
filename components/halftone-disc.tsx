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

const SIZE = 300; // canvas units; CSS scales it
const GRID = 32; // dots across
const CELL = SIZE / GRID;
const RADIUS = SIZE / 2;
const SUPER = 4; // supersampling when rasterising the mark

/* The tile feel spec, applied to a particle: stiffness 400, damping 32. */
const STIFFNESS = 400;
const DAMPING = 32;
const PUSH_RADIUS = 78;
const PUSH_STRENGTH = 30;

/* The ripple is a travelling ring, not a flash: dots are struck as the front
   passes them, so the disc reads as a surface with something moving across it. */
const RIPPLE_SPEED = 320; // units per second
const RIPPLE_WIDTH = 26;
const RIPPLE_STRENGTH = 340;
const RIPPLE_LIFE = 1.3; // seconds

type Dot = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  /** Current ink value, and the value it is travelling toward. */
  v: number;
  tv: number;
};

type Ripple = { x: number; y: number; born: number };

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = (col + 0.5) * CELL;
      const y = (row + 0.5) * CELL;
      if (Math.hypot(x - RADIUS, y - RADIUS) > RADIUS - CELL * 0.35) continue;
      dots.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0, v: 0, tv: 0 });
    }
  }
  return dots;
}

/**
 * The Spotify mark, rasterised into the same value grid the artwork uses.
 *
 * Drawing it rather than shipping an image means it inherits the dot field
 * exactly: the mark is not placed on the disc, it is what the disc is made of.
 */
function markValues(): number[] {
  const s = GRID * SUPER;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Array(GRID * GRID).fill(0.5);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, s, s);

  // The body.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
  ctx.fill();

  // The three waves, cut back out of it.
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  const waves: [number, number, number][] = [
    [0.72, 0.4, 0.082],
    [0.82, 0.36, 0.07],
    [0.92, 0.32, 0.058],
  ];
  for (const [cy, r, width] of waves) {
    ctx.lineWidth = s * width;
    ctx.beginPath();
    ctx.arc(s / 2, s * cy, s * r, (215 * Math.PI) / 180, (325 * Math.PI) / 180);
    ctx.stroke();
  }

  const pixels = ctx.getImageData(0, 0, s, s).data;
  const values: number[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      // Box-average the supersampled block so edges land as mid values.
      let sum = 0;
      for (let dy = 0; dy < SUPER; dy++) {
        for (let dx = 0; dx < SUPER; dx++) {
          const i = ((row * SUPER + dy) * s + (col * SUPER + dx)) * 4;
          sum += pixels[i];
        }
      }
      values.push(sum / (SUPER * SUPER * 255));
    }
  }
  return values;
}

function cellIndex(dot: Dot) {
  const col = Math.min(GRID - 1, Math.floor(dot.x / CELL));
  const row = Math.min(GRID - 1, Math.floor(dot.y / CELL));
  return row * GRID + col;
}

function setTargets(dots: Dot[], values: number[]) {
  for (const dot of dots) dot.tv = values[cellIndex(dot)] ?? 0.5;
}

/** Jump straight to the target — first paint, and reduced motion. */
function settle(dots: Dot[]) {
  for (const dot of dots) dot.v = dot.tv;
}

/** Rec. 601 luma — the standard weighting for perceived brightness. */
function artValues(pixels: Uint8ClampedArray) {
  const values: number[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const p = i * 4;
    values.push((0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255);
  }
  return values;
}

function clock(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Now-playing as an ordered-dither disc.
 *
 * Silent, the dots hold the Spotify mark. When a track starts they migrate into
 * the dithered album artwork and back again when it stops, so the disc always
 * says what it is even when there is nothing to show.
 *
 * Dithering is what lets real artwork onto a site with no accent hue: the colour
 * is not suppressed, it is discarded, and what is left is the one thing the
 * palette trades in — value.
 *
 * The frame loop is what keeps Law 4. It runs while the pointer is inside, while
 * dots are settling, while a value transition is in flight, or while a ripple is
 * alive — and stops itself the moment all four are false.
 */
export function HalftoneDisc({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>(buildDots());
  const markRef = useRef<number[] | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const reducedRef = useRef(false);

  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  /* Ink is light on a dark ground and dark on a light one, so "more ink" flips
     with the skin. Without this the disc reads as a negative. */
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
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("color") || "#f5f5f5";

    for (const dot of dotsRef.current) {
      const value = invert ? 1 - dot.v : dot.v;
      const r = Math.max(0.45, value * CELL * 0.62);
      ctx.globalAlpha = 0.2 + value * 0.8;
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
      const ripples = ripplesRef.current;
      let busy = false;

      for (const dot of dotsRef.current) {
        // Value migration — mark into artwork and back.
        if (Math.abs(dot.tv - dot.v) > 0.002) {
          dot.v += (dot.tv - dot.v) * Math.min(1, dt * 6);
          busy = true;
        } else {
          dot.v = dot.tv;
        }

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

        for (const ripple of ripples) {
          const dx = dot.x - ripple.x;
          const dy = dot.y - ripple.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.001) continue;
          const age = (now - ripple.born) / 1000;
          const front = age * RIPPLE_SPEED;
          const offset = Math.abs(dist - front);
          if (offset > RIPPLE_WIDTH) continue;
          // Struck as the front passes, and fading as the ring travels out.
          const strength =
            (1 - offset / RIPPLE_WIDTH) * (1 - age / RIPPLE_LIFE) * RIPPLE_STRENGTH;
          dot.vx += (dx / dist) * strength * dt;
          dot.vy += (dy / dist) * strength * dt;
        }

        const ax = STIFFNESS * (tx - dot.ox) - DAMPING * dot.vx;
        const ay = STIFFNESS * (ty - dot.oy) - DAMPING * dot.vy;
        dot.vx += ax * dt;
        dot.vy += ay * dt;
        dot.ox += dot.vx * dt;
        dot.oy += dot.vy * dt;

        if (Math.abs(dot.vx) + Math.abs(dot.vy) + Math.abs(dot.ox) + Math.abs(dot.oy) > 0.05) {
          busy = true;
        }
      }

      ripplesRef.current = ripples.filter((r) => (now - r.born) / 1000 < RIPPLE_LIFE);

      draw();

      if (pointer || busy || ripplesRef.current.length > 0) {
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

  // Rasterise the mark once, and start on it.
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    markRef.current = markValues();
    setTargets(dotsRef.current, markRef.current);
    settle(dotsRef.current);
    draw();

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw, resolvedTheme]);

  /* Poll on the same cadence as the counters. Nothing playing is a normal
     answer, not an error — the dots simply return to the mark. */
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

    const toMark = () => {
      if (!markRef.current) return;
      setTargets(dotsRef.current, markRef.current);
      if (reducedRef.current) {
        settle(dotsRef.current);
        draw();
      } else {
        run();
      }
    };

    if (!art) {
      toMark();
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
      try {
        setTargets(dotsRef.current, artValues(octx.getImageData(0, 0, GRID, GRID).data));
      } catch {
        return; // tainted despite the proxy — hold the mark
      }

      if (reducedRef.current) {
        settle(dotsRef.current);
        draw();
      } else {
        run();
      }
    };

    img.onerror = toMark;
    img.src = art;
    return () => {
      cancelled = true;
    };
  }, [track?.artUrl, track?.isPlaying, draw, run]);

  const toLocal = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const playing = Boolean(track?.isPlaying && track.title);
  const label = playing
    ? `Now playing: ${track!.title} by ${track!.artist}. Click the disc to ripple it.`
    : "Nothing playing. Click the disc to ripple it.";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        role="img"
        aria-label={label}
        title={label}
        onPointerMove={(event) => {
          if (reducedRef.current) return;
          pointerRef.current = toLocal(event);
          run();
        }}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => {
          pointerRef.current = null;
          setOpen(false);
          if (!reducedRef.current) run();
        }}
        onPointerDown={(event) => {
          if (reducedRef.current) return;
          const { x, y } = toLocal(event);
          ripplesRef.current.push({ x, y, born: performance.now() });
          run();
        }}
        className="w-[128px] cursor-pointer text-ink"
      >
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-auto w-full" />
      </div>

      {/* The record. Present in the layout at all times so revealing it never
          shifts anything around it. */}
      {/* Wider than the 128px disc on purpose — the track line has to fit
          without crushing, and the block is always present so revealing it
          never shifts the layout. */}
      <div className="h-9 w-[15rem] max-w-full text-center">
        <div
          className={`transition-opacity duration-200 ${open || playing ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">
            {playing ? "Now playing" : "Spotify"}
          </p>
          {playing ? (
            <a
              href={track!.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-[0.6875rem] text-ink-2 transition-colors hover:text-ink"
            >
              <span className="text-ink">{track!.title}</span>
              <span className="text-ink-3"> — </span>
              {track!.artist}
              {Boolean(track!.durationMs) && (
                <span className="text-ink-3">
                  {" "}
                  {clock(track!.progressMs ?? 0)}/{clock(track!.durationMs ?? 0)}
                </span>
              )}
            </a>
          ) : (
            <p className="mt-0.5 text-[0.6875rem] text-ink-3">
              {track === null ? "—" : "Nothing playing"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
