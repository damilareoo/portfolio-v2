"use client";

import { useRef, useState } from "react";
import { LANDMARKS, blendAt, useValueField, type Blend } from "@/lib/value-field";

/**
 * The colophon's instrument.
 *
 * Move across the field and the page's mid-ladder tokens are re-derived live
 * from the nearest landmarks. Click to commit — the blend then holds across
 * navigation and resets on refresh.
 *
 * It is a slider, not a toy: every position it can reach is a legible page,
 * because the ramps it interpolates are clamped at both ends.
 */
export function ValueField() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const { committed, preview, commit } = useValueField();
  const [hover, setHover] = useState<(Blend & { x: number; y: number }) | null>(null);

  const read = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    return { x, y, ...blendAt(x, y) };
  };

  const nearest = hover
    ? LANDMARKS.reduce((best, point) =>
        Math.hypot(hover.x - point.x, hover.y - point.y) <
        Math.hypot(hover.x - best.x, hover.y - best.y)
          ? point
          : best,
      )
    : null;

  return (
    <div>
      <div
        ref={surfaceRef}
        onPointerMove={(event) => {
          const next = read(event);
          if (!next) return;
          setHover(next);
          preview(next);
        }}
        onPointerLeave={() => {
          setHover(null);
          preview(null);
        }}
        onClick={() => {
          if (hover) commit({ weight: hover.weight, contrast: hover.contrast });
        }}
        className="relative h-[240px] w-full cursor-crosshair overflow-hidden rounded-[var(--radius-tile)] border border-line bg-surface-2"
      >
        {/* Axes, labelled — the field states what it is measuring. */}
        <span className="pointer-events-none absolute left-3 top-3 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
          Contrast ↑
        </span>
        <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
          Weight →
        </span>

        {LANDMARKS.map((point) => {
          const active = nearest?.name === point.name;
          return (
            <span
              key={point.name}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span
                className={`block size-1.5 rounded-full transition-colors ${
                  active ? "bg-ink" : "bg-ink-3"
                }`}
              />
              <span
                className={`absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-mono text-[0.5625rem] uppercase tracking-wider transition-opacity ${
                  active ? "text-ink-2 opacity-100" : "text-ink-3 opacity-0"
                }`}
              >
                {point.name}
              </span>
            </span>
          );
        })}

        {hover && (
          <span
            style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}
            className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-3">
          {hover
            ? `Weight ${Math.round(hover.weight)} · Contrast ${hover.contrast.toFixed(2)}`
            : committed
              ? `Held at weight ${Math.round(committed.weight)} · contrast ${committed.contrast.toFixed(2)}`
              : "Move your cursor"}
        </p>
        {committed && (
          <button
            type="button"
            onClick={() => commit(null)}
            className="font-mono text-[0.5625rem] uppercase tracking-wider text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
