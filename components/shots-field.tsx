"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import {
  BAND,
  FILL,
  PITCH,
  cellsAcross,
  emitter,
  panelFrom,
  smoothstep,
  type Panel,
} from "@/lib/glyph/panel";
import {
  COLUMNS_NARROW,
  COLUMNS_WIDE,
  DRIFT,
  WIDE_QUERY,
  bucketShots,
} from "@/lib/shots-layout";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Asset } from "@/data/assets.generated";

/** How long a front takes to cross. Noticed, rather than watched. */
const SWEEP = 620;

/** Tiles arriving within this window share one front instead of firing apart. */
const BATCH = 80;

/** The sweep runs down and slightly right, so it crosses rather than falls. */
const SKEW = 0.22;

type Tile = { frame: HTMLElement; canvas: HTMLCanvasElement; img: HTMLImageElement };

export function ShotsField({ shots }: { shots: Asset[] }) {
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef(new WeakMap<HTMLElement, Panel>());
  const columns = useMediaQuery(WIDE_QUERY) ? COLUMNS_WIDE : COLUMNS_NARROW;

  /* Sampling reads the decoded image back out of a canvas, which taints on a
     cross-origin source and throws. Everything here is same-origin, but a
     failure must leave the photograph visible rather than an empty panel. */
  const sample = useCallback((tile: Tile): Panel | null => {
    const { frame, img } = tile;
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h || !img.naturalWidth) return null;
    const cols = cellsAcross(w);
    const rows = cellsAcross(h);
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const ctx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, cols, rows);
    try {
      return panelFrom(ctx.getImageData(0, 0, cols, rows).data, cols, rows);
    } catch {
      return null;
    }
  }, []);

  const paint = useCallback((tile: Tile, front: number) => {
    const panel = panels.current.get(tile.frame);
    if (!panel) return;
    const { cols, rows, values } = panel;
    const w = tile.frame.clientWidth;
    const h = tile.frame.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (tile.canvas.width !== Math.round(w * dpr)) {
      tile.canvas.width = Math.round(w * dpr);
      tile.canvas.height = Math.round(h * dpr);
    }
    const ctx = tile.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-1").trim();

    const cw = w / cols;
    const ch = h / rows;
    const radius = (Math.min(cw, ch) * FILL) / 2;
    const band = BAND * window.innerHeight;
    const box = tile.frame.getBoundingClientRect();
    const originX = box.left;
    const originY = box.top + window.scrollY;

    for (let y = 0; y < rows; y++) {
      const cy = y * ch + ch / 2;
      const pageY = originY + y * ch;
      for (let x = 0; x < cols; x++) {
        const along = pageY + (originX + x * cw) * SKEW;
        const alpha = emitter(values[y * cols + x], (front - along) / band);
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x * cw + cw / 2, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const host = root.current;
    if (!host) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiles = [...host.querySelectorAll<HTMLElement>("[data-frame]")].map((frame) => ({
      frame,
      canvas: frame.querySelector("canvas") as HTMLCanvasElement,
      img: frame.querySelector("img") as HTMLImageElement,
    }));

    /* Reduced motion is given the value, never the journey to it. */
    if (still) {
      tiles.forEach((t) => t.img.style.setProperty("opacity", "1"));
      return;
    }

    let queue: Tile[] = [];
    let timer: number | undefined;
    let frames: number[] = [];

    const run = (members: Tile[]) => {
      if (!members.length) return;
      const band = BAND * window.innerHeight;
      const spans = members.map((t) => {
        const b = t.frame.getBoundingClientRect();
        return [b.top + window.scrollY + b.left * SKEW, b.bottom + window.scrollY + b.right * SKEW];
      });
      const from = Math.min(...spans.map((s) => s[0])) - band;
      const to = Math.max(...spans.map((s) => s[1])) + band;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / SWEEP);
        const front = from + (to - from) * t;
        for (const tile of members) {
          paint(tile, front);
          const b = tile.frame.getBoundingClientRect();
          /* The photograph takes over while the front is still crossing, so the
             panel is never the finished picture — only the moment before it. */
          const mid = b.top + window.scrollY + b.height * 0.45 + b.left * SKEW;
          tile.img.style.opacity = String(smoothstep((front - mid) / band + 0.3));
        }
        if (t < 1) frames.push(requestAnimationFrame(step));
        else
          members.forEach((tile) => {
            tile.img.style.opacity = "1";
            const ctx = tile.canvas.getContext("2d");
            ctx?.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
          });
      };
      frames.push(requestAnimationFrame(step));
    };

    const enqueue = (tile: Tile) => {
      const panel = sample(tile);
      if (!panel) {
        tile.img.style.opacity = "1";
        return;
      }
      panels.current.set(tile.frame, panel);
      paint(tile, -Infinity);
      queue.push(tile);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const batch = queue;
        queue = [];
        run(batch);
      }, BATCH);
    };

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const tile = tiles.find((t) => t.frame === entry.target);
          if (!tile) return;
          io.unobserve(entry.target);
          if (tile.img.complete && tile.img.naturalWidth) enqueue(tile);
          else tile.img.addEventListener("load", () => enqueue(tile), { once: true });
        }),
      { rootMargin: "220px 0px", threshold: 0.01 },
    );
    tiles.forEach((t) => io.observe(t.frame));

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      frames.forEach(cancelAnimationFrame);
      frames = [];
    };
    /* Columns is a dependency: crossing the breakpoint rebuilds the columns,
       and the observer has to be rebuilt with them or it spends the rest of
       the page watching frames that are no longer in the document. */
  }, [paint, sample, shots, columns]);

  const buckets = bucketShots(shots, columns);

  return (
    <div
      ref={root}
      className="grid grid-cols-2 gap-[21px] lg:grid-cols-4"
      style={{ alignItems: "start" }}
    >
      {buckets.map((bucket, c) => (
        <div
          key={c}
          className="flex flex-col gap-[21px]"
          style={{ paddingTop: `${DRIFT[c % DRIFT.length] * PITCH}px` }}
        >
          {bucket.map((shot) => (
            <div
              key={shot.src}
              data-frame
              className="relative overflow-hidden bg-surface-2"
              style={{ aspectRatio: `${shot.width} / ${shot.height}` }}
            >
              <canvas className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
              <Image
                src={shot.src}
                alt={shot.title}
                width={shot.width}
                height={shot.height}
                sizes="(min-width: 1024px) 24vw, 46vw"
                className="h-full w-full object-cover opacity-0"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
